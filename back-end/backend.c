/* Small C HTTP server for the charging station admin dashboard.
   Build from this directory with: cc -std=c11 -O2 server.c -o server */
#define _POSIX_C_SOURCE 200809L
#include <arpa/inet.h>
#include <ctype.h>
#include <errno.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

#define PORT 3000
#define MAX_REQUEST 65536
#define MAX_JSON 65536
#define MAX_VEHICLES 100
#define MAX_QUEUE 100
#define MAX_CHARGERS 32
#define MAX_HISTORY 100

typedef struct
{
  char id[32], owner[80], model[80], connector[20], last[40], status[24];
  int battery, sessions;
  double capacity;
} Vehicle;
typedef struct
{
  char id[32], owner[80], arrival[16];
  int battery, requested, waiting, target;
  time_t arrived_at;
} QueueItem;
typedef struct
{
  char id[16], type[20], status[20], vehicle[32];
  int power, minutes, battery, target, start_battery;
  time_t started_at;
} Charger;
typedef struct
{
  char id[20], date[32], vehicle[32], charger[16], start[8], end[8], duration[20], status[20];
  double energy;
} Session;

static Vehicle vehicles[MAX_VEHICLES];
static int vehicle_count;
static QueueItem queue_items[MAX_QUEUE];
static int queue_count;
static Charger chargers[MAX_CHARGERS];
static int charger_count;
static Session history[MAX_HISTORY] = {
    {"SES-1047", "Sep 24, 2026", "AP39AB1234", "CH-04", "11:02", "12:44", "1h 42m", "Completed", 52.3},
    {"SES-1046", "Sep 24, 2026", "KA05IJ7890", "CH-01", "09:15", "10:08", "53m", "Completed", 28.7},
    {"SES-1045", "Sep 24, 2026", "AP39EF9012", "CH-11", "08:00", "09:12", "1h 12m", "Completed", 67.4},
    {"SES-1044", "Sep 23, 2026", "MH12AB5678", "CH-02", "19:30", "21:05", "1h 35m", "Completed", 89.2},
    {"SES-1043", "Sep 23, 2026", "DL3CAA2341", "CH-07", "17:44", "18:22", "38m", "Stopped", 3.1},
    {"SES-1042", "Sep 23, 2026", "AP40CD5678", "CH-03", "16:12", "17:26", "1h 14m", "Completed", 41.8},
    {"SES-1041", "Sep 22, 2026", "GJ01MN6789", "CH-05", "14:02", "15:31", "1h 29m", "Completed", 57.6},
    {"SES-1040", "Sep 22, 2026", "KA01CD9012", "CH-06", "10:45", "11:52", "1h 07m", "Completed", 34.5}};
static int history_count = 8;

static void seed(void)
{
#define V(A_ID, A_OWNER, A_MODEL, A_BATTERY, A_CAPACITY, A_CONNECTOR, A_SESSIONS, A_LAST, A_STATUS) \
  do                                                                                                \
  {                                                                                                 \
    Vehicle *v = &vehicles[vehicle_count++];                                                        \
    snprintf(v->id, sizeof v->id, "%s", A_ID);                                                      \
    snprintf(v->owner, sizeof v->owner, "%s", A_OWNER);                                             \
    snprintf(v->model, sizeof v->model, "%s", A_MODEL);                                             \
    v->battery = A_BATTERY;                                                                         \
    v->capacity = A_CAPACITY;                                                                       \
    snprintf(v->connector, sizeof v->connector, "%s", A_CONNECTOR);                                 \
    v->sessions = A_SESSIONS;                                                                       \
    snprintf(v->last, sizeof v->last, "%s", A_LAST);                                                \
    snprintf(v->status, sizeof v->status, "%s", A_STATUS);                                          \
  } while (0)
  V("AP39AB1234", "krian", "Tata Nexon EV", 64, 40.5, "CCS2", 24, "Today 14:08", "Charging");
  V("AP40CD5678", "sandhya", "MG ZS EV", 15, 50.3, "CCS2", 18, "Yesterday 18:22", "Queued");
  V("MH12AB5678", "gowtham", "Hyundai Ioniq 5", 41, 72.6, "CCS2", 31, "Today 14:24", "Charging");
  V("KA01CD9012", "kishore", "Kia EV6", 77, 77.4, "Type 2", 12, "Today 13:50", "Charging");
  V("DL3CAA2341", "jack devarakonda", "Ola S1 Pro", 55, 3.97, "CCS2", 45, "Today 14:15", "Charging");
  V("MH14GH3456", "sneha", "Nexon EV Max", 19, 40.5, "Type 2", 9, "2 days ago", "Queued");
#define Q(A_ID, A_OWNER, A_BATTERY, A_REQUESTED, A_WAITING, A_ARRIVAL) \
  do                                                                   \
  {                                                                    \
    QueueItem *q = &queue_items[queue_count++];                        \
    snprintf(q->id, sizeof q->id, "%s", A_ID);                         \
    snprintf(q->owner, sizeof q->owner, "%s", A_OWNER);                \
    q->battery = A_BATTERY;                                            \
    q->requested = A_REQUESTED;                                        \
    q->target = 80;                                                    \
    q->waiting = A_WAITING;                                            \
    q->arrived_at = time(NULL) - (time_t)(A_WAITING) * 60;             \
    snprintf(q->arrival, sizeof q->arrival, "%s", A_ARRIVAL);          \
  } while (0)
  Q("AP39AB1234", "kiran", 8, 35, 4, "14:32");
  Q("AP40CD5678", "sandy", 15, 40, 8, "14:28");
  Q("AP39EF9012", "gowtham", 42, 25, 12, "14:24");
  Q("MH14GH3456", "kishore", 19, 30, 15, "14:21");
  Q("KA05IJ7890", "jack devarakonda", 63, 20, 19, "14:17");
  Q("TN09KL2345", "burito", 28, 45, 23, "14:13");
  Q("AP39NV2007", "Kasyap", 2, 20, 30, "16:22");
#define C(A_ID, A_TYPE, A_STATUS, A_VEHICLE, A_POWER, A_MINUTES, A_BATTERY) \
  do                                                                        \
  {                                                                         \
    Charger *c = &chargers[charger_count++];                                \
    snprintf(c->id, sizeof c->id, "%s", A_ID);                              \
    snprintf(c->type, sizeof c->type, "%s", A_TYPE);                        \
    snprintf(c->status, sizeof c->status, "%s", A_STATUS);                  \
    snprintf(c->vehicle, sizeof c->vehicle, "%s", A_VEHICLE);               \
    c->power = A_POWER;                                                     \
    c->minutes = 0;                                                         \
    c->battery = A_BATTERY;                                                 \
    c->target = 80;                                                         \
    c->start_battery = A_BATTERY;                                           \
    c->started_at = !strcmp(c->status, "Charging") ? time(NULL) : 0;        \
  } while (0)
  C("CH-01", "CCS2", "Available", "", 0, 0, 0);
  C("CH-02", "CCS2", "Charging", "AP39AB1234", 92, 34, 64);
  C("CH-03", "Type 2", "Maintenance", "", 0, 0, 0);
  C("CH-04", "CCS2", "Charging", "MH12AB5678", 118, 18, 41);
  C("CH-05", "Type 2", "Charging", "KA01CD9012", 19, 52, 77);
  C("CH-06", "CHAdeMO", "Available", "", 0, 0, 0);
  C("CH-07", "CCS2", "Available", "", 0, 0, 0);
  C("CH-08", "Type 2", "Offline", "", 0, 0, 0);
}

static void addf(char *out, size_t cap, const char *fmt, ...)
{
  va_list ap;
  size_t used = strlen(out);
  if (used >= cap)
    return;
  va_start(ap, fmt);
  vsnprintf(out + used, cap - used, fmt, ap);
  va_end(ap);
}
static void json_string(char *out, size_t cap, const char *s)
{
  size_t n = 0;
  if (cap < 3)
    return;
  out[n++] = '"';
  for (; *s && n + 3 < cap; s++)
  {
    unsigned char c = (unsigned char)*s;
    if (c == '"' || c == '\\')
    {
      out[n++] = '\\';
      out[n++] = (char)c;
    }
    else if (c < 32)
    {
      out[n++] = ' ';
    }
    else
      out[n++] = (char)c;
  }
  out[n++] = '"';
  out[n] = '\0';
}
static const char *priority(int b) { return b <= 10 ? "Emergency" : b <= 20 ? "High"
                                                                            : "Normal"; }
static void json_vehicle(char *o, size_t n, const Vehicle *v)
{
  char a[180], b[180], c[180], d[180], e[180], f[180];
  json_string(a, sizeof a, v->id);
  json_string(b, sizeof b, v->owner);
  json_string(c, sizeof c, v->model);
  json_string(d, sizeof d, v->connector);
  json_string(e, sizeof e, v->last);
  json_string(f, sizeof f, v->status);
  snprintf(o, n, "{\"id\":%s,\"owner\":%s,\"model\":%s,\"battery\":%d,\"capacity\":%.2f,\"connector\":%s,\"sessions\":%d,\"last\":%s,\"status\":%s}", a, b, c, v->battery, v->capacity, d, v->sessions, e, f);
}
static void json_queue(char *o, size_t n, const QueueItem *q)
{
  char a[100], b[180], c[80];
  json_string(a, sizeof a, q->id);
  json_string(b, sizeof b, q->owner);
  json_string(c, sizeof c, q->arrival);
  snprintf(o, n, "{\"id\":%s,\"owner\":%s,\"battery\":%d,\"requested\":%d,\"target\":%d,\"waiting\":%d,\"arrival\":%s}", a, b, q->battery, q->requested, q->target, q->waiting, c);
}
static void json_charger(char *o, size_t n, const Charger *c)
{
  char a[80], b[80], s[80], v[100];
  json_string(a, sizeof a, c->id);
  json_string(b, sizeof b, c->type);
  json_string(s, sizeof s, c->status);
  json_string(v, sizeof v, c->vehicle);
  if (c->vehicle[0])
    snprintf(o, n, "{\"id\":%s,\"type\":%s,\"status\":%s,\"vehicle\":%s,\"power\":%d,\"minutes\":%d,\"battery\":%d,\"target\":%d}", a, b, s, v, c->power, c->minutes, c->battery, c->target);
  else
    snprintf(o, n, "{\"id\":%s,\"type\":%s,\"status\":%s}", a, b, s);
}
static void json_session(char *o, size_t n, const Session *s)
{
  char a[80], b[100], c[100], d[80], e[60], f[60], g[60], h[60];
  json_string(a, sizeof a, s->id);
  json_string(b, sizeof b, s->date);
  json_string(c, sizeof c, s->vehicle);
  json_string(d, sizeof d, s->charger);
  json_string(e, sizeof e, s->start);
  json_string(f, sizeof f, s->end);
  json_string(g, sizeof g, s->duration);
  json_string(h, sizeof h, s->status);
  snprintf(o, n, "{\"id\":%s,\"date\":%s,\"vehicle\":%s,\"charger\":%s,\"start\":%s,\"end\":%s,\"energy\":%.1f,\"duration\":%s,\"status\":%s}", a, b, c, d, e, f, s->energy, g, h);
}
static void json_array(char *out, size_t cap, int kind)
{
  out[0] = '\0';
  addf(out, cap, "[");
  int count = kind == 0 ? vehicle_count : kind == 1 ? queue_count
                                      : kind == 2   ? charger_count
                                                    : history_count;
  for (int i = 0; i < count; i++)
  {
    char item[1024];
    if (kind == 0)
      json_vehicle(item, sizeof item, &vehicles[i]);
    else if (kind == 1)
      json_queue(item, sizeof item, &queue_items[i]);
    else if (kind == 2)
      json_charger(item, sizeof item, &chargers[i]);
    else
      json_session(item, sizeof item, &history[i]);
    addf(out, cap, "%s%s", i ? "," : "", item);
  }
  addf(out, cap, "]");
}
static void send_all(int fd, const char *data, size_t len)
{
  while (len)
  {
    ssize_t n = send(fd, data, len, 0);
    if (n <= 0)
      return;
    data += n;
    len -= (size_t)n;
  }
}
static void respond(int fd, int code, const char *type, const char *body)
{
  char head[512];
  int n = snprintf(head, sizeof head, "HTTP/1.1 %d %s\r\nContent-Type: %s\r\nContent-Length: %zu\r\nConnection: close\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n\r\n", code, code == 200 ? "OK" : code == 201 ? "Created"
                                                                                                                                                                                         : code == 400   ? "Bad Request"
                                                                                                                                                                                         : code == 404   ? "Not Found"
                                                                                                                                                                                         : code == 409   ? "Conflict"
                                                                                                                                                                                                         : "Error",
                   type, strlen(body));
  send_all(fd, head, (size_t)n);
  send_all(fd, body, strlen(body));
}
static void error_json(int fd, int code, const char *message)
{
  char b[512], m[400];
  json_string(m, sizeof m, message);
  snprintf(b, sizeof b, "{\"error\":%s}", m);
  respond(fd, code, "application/json; charset=utf-8", b);
}
static char *value(char *body, const char *key, char *out, size_t cap)
{
  char needle[64];
  snprintf(needle, sizeof needle, "\"%s\"", key);
  char *p = strstr(body, needle);
  if (!p)
    return NULL;
  p = strchr(p, ':') + 1;
  while (isspace((unsigned char)*p))
    p++;
  if (*p == '"')
  {
    p++;
    size_t i = 0;
    while (*p && *p != '"' && i + 1 < cap)
    {
      if (*p == '\\' && p[1])
        p++;
      out[i++] = *p++;
    }
    out[i] = '\0';
    return out;
  }
  size_t i = 0;
  while (*p && *p != ',' && *p != '}' && !isspace((unsigned char)*p) && i + 1 < cap)
    out[i++] = *p++;
  out[i] = '\0';
  return out;
}
static void serve_file(int fd, const char *path)
{
  char full[512];
  snprintf(full, sizeof full, "../front-end/%s", strcmp(path, "/") == 0 ? "index.html" : path + 1);
  if (strstr(path, ".."))
  {
    respond(fd, 403, "text/plain", "Forbidden");
    return;
  }
  FILE *f = fopen(full, "rb");
  if (!f)
  {
    respond(fd, 404, "text/plain", "Not found");
    return;
  }
  fseek(f, 0, SEEK_END);
  long size = ftell(f);
  rewind(f);
  char *data = malloc((size_t)size + 1);
  if (!data)
  {
    fclose(f);
    respond(fd, 500, "text/plain", "Out of memory");
    return;
  }
  size_t got = fread(data, 1, (size_t)size, f);
  fclose(f);
  data[got] = '\0';
  const char *type = strstr(full, ".css") ? "text/css; charset=utf-8" : strstr(full, ".js") ? "text/javascript; charset=utf-8"
                                                                                            : "text/html; charset=utf-8";
  char h[256];
  int hn = snprintf(h, sizeof h, "HTTP/1.1 200 OK\r\nContent-Type: %s\r\nContent-Length: %zu\r\nConnection: close\r\n\r\n", type, got);
  send_all(fd, h, (size_t)hn);
  send_all(fd, data, got);
  free(data);
}
static int pri_rank(const QueueItem *q) { return q->battery <= 10 ? 0 : q->battery <= 20 ? 1
                                                                    : q->waiting >= 15   ? 2
                                                                                         : 3; }
static int cmp_queue(const void *aa, const void *bb)
{
  const QueueItem *a = aa, *b = bb;
  int x = pri_rank(a) - pri_rank(b);
  if (x)
    return x;
  if (a->battery != b->battery)
    return a->battery - b->battery;
  return b->waiting - a->waiting;
}
static void update_queue_waits(time_t now)
{
  for (int i = 0; i < queue_count; i++)
  {
    if (queue_items[i].arrived_at > 0)
    {
      int mins = (int)difftime(now, queue_items[i].arrived_at) / 60;
      if (mins > queue_items[i].waiting)
        queue_items[i].waiting = mins;
    }
  }
}
static void finish_charging(Charger *c, const char *status, time_t ended)
{
  int final_battery = !strcmp(status, "Completed") ? c->target : c->battery;
  int elapsed = c->started_at > 0 ? (int)difftime(ended, c->started_at) : 0;
  if (elapsed < 0)
    elapsed = 0;
  if (history_count < MAX_HISTORY)
  {
    char end_time[8], start_time[8], date[32], duration[20];
    struct tm *t = localtime(&ended);
    if (t)
    {
      strftime(end_time, sizeof end_time, "%H:%M", t);
      strftime(date, sizeof date, "%b %d, %Y", t);
    }
    else
    {
      snprintf(end_time, sizeof end_time, "--:--");
      snprintf(date, sizeof date, "Today");
    }
    time_t began = ended - (time_t)elapsed;
    t = localtime(&began);
    if (t)
      strftime(start_time, sizeof start_time, "%H:%M", t);
    else
      snprintf(start_time, sizeof start_time, "%s", end_time);
    int mins = (elapsed + 30) / 60;
    if (mins >= 60)
      snprintf(duration, sizeof duration, "%dh %02dm", mins / 60, mins % 60);
    else
      snprintf(duration, sizeof duration, "%dm", mins);
    for (int i = history_count; i > 0; i--)
      history[i] = history[i - 1];
    Session *s = &history[0];
    history_count++;
    memset(s, 0, sizeof *s);
    snprintf(s->id, sizeof s->id, "SES-%04d", 1039 + history_count);
    snprintf(s->date, sizeof s->date, "%s", date);
    snprintf(s->vehicle, sizeof s->vehicle, "%s", c->vehicle);
    snprintf(s->charger, sizeof s->charger, "%s", c->id);
    snprintf(s->start, sizeof s->start, "%s", start_time);
    snprintf(s->end, sizeof s->end, "%s", end_time);
    snprintf(s->duration, sizeof s->duration, "%s", duration);
    snprintf(s->status, sizeof s->status, "%s", status);
    for (int i = 0; i < vehicle_count; i++)
      if (!strcmp(vehicles[i].id, c->vehicle))
      {
        s->energy = vehicles[i].capacity * (final_battery - c->start_battery) / 100.0;
        break;
      }
  }
  for (int i = 0; i < vehicle_count; i++)
    if (!strcmp(vehicles[i].id, c->vehicle))
    {
      vehicles[i].battery = final_battery;
      vehicles[i].sessions++;
      snprintf(vehicles[i].status, sizeof vehicles[i].status, "Available");
      struct tm *t = localtime(&ended);
      if (t)
        snprintf(vehicles[i].last, sizeof vehicles[i].last, "Today %02d:%02d", t->tm_hour, t->tm_min);
      break;
    }
  snprintf(c->status, sizeof c->status, "Available");
  c->vehicle[0] = '\0';
  c->power = 0;
  c->minutes = 0;
  c->battery = 0;
  c->target = 0;
  c->started_at = 0;
}
static void advance_charging(time_t now)
{
  for (int i = 0; i < charger_count; i++)
  {
    Charger *c = &chargers[i];
    if (strcmp(c->status, "Charging") || c->started_at <= 0)
      continue;
    int elapsed = (int)difftime(now, c->started_at);
    if (elapsed < 0)
      elapsed = 0;
    c->minutes = elapsed / 60;
    if (elapsed >= 330)
    {
      c->battery = c->target;
      finish_charging(c, "Completed", now);
      continue;
    }
    double ratio = (double)elapsed / 330.0;
    c->battery = c->start_battery + (int)((c->target - c->start_battery) * ratio + 0.5);
  }
}
static void handle_api(int fd, char *method, char *path, char *body)
{
  char out[MAX_JSON];
  if (!strcmp(method, "OPTIONS"))
  {
    respond(fd, 200, "text/plain", "");
    return;
  }
  time_t now = time(NULL);
  advance_charging(now);
  update_queue_waits(now);
  qsort(queue_items, (size_t)queue_count, sizeof queue_items[0], cmp_queue);
  if (!strcmp(method, "GET") && !strcmp(path, "/api/state"))
  {
    char a[20000], b[12000], c[8000], d[8000];
    json_array(a, sizeof a, 0);
    json_array(b, sizeof b, 1);
    json_array(c, sizeof c, 2);
    json_array(d, sizeof d, 3);
    snprintf(out, sizeof out, "{\"vehicles\":%s,\"queue\":%s,\"chargers\":%s,\"history\":%s}", a, b, c, d);
    respond(fd, 200, "application/json; charset=utf-8", out);
    return;
  }
  int kind = !strcmp(path, "/api/vehicles") ? 0 : !strcmp(path, "/api/queue")  ? 1
                                              : !strcmp(path, "/api/chargers") ? 2
                                              : !strcmp(path, "/api/history")  ? 3
                                                                               : -1;
  if (!strcmp(method, "GET") && kind >= 0)
  {
    json_array(out, sizeof out, kind);
    respond(fd, 200, "application/json; charset=utf-8", out);
    return;
  }
  if (!strcmp(method, "POST") && !strcmp(path, "/api/queue/recalculate"))
  {
    qsort(queue_items, (size_t)queue_count, sizeof queue_items[0], cmp_queue);
    json_array(out, sizeof out, 1);
    respond(fd, 200, "application/json; charset=utf-8", out);
    return;
  }
  if (!strcmp(method, "POST") && !strncmp(path, "/api/chargers/", 14) && strstr(path + 14, "/status"))
  {
    char *end = strstr(path + 14, "/status");
    *end = '\0';
    int ci = -1;
    for (int i = 0; i < charger_count; i++)
      if (!strcmp(chargers[i].id, path + 14))
      {
        ci = i;
        break;
      }
    char status[32] = {0};
    value(body, "status", status, sizeof status);
    if (ci < 0)
    {
      error_json(fd, 404, "Charger not found.");
      return;
    }
    if (strcmp(status, "Available") && strcmp(status, "Offline") && strcmp(status, "Maintenance"))
    {
      error_json(fd, 400, "Choose Available, Offline, or Maintenance.");
      return;
    }
    if (!strcmp(chargers[ci].status, "Charging"))
    {
      error_json(fd, 409, "Stop charging before changing this charger's status.");
      return;
    }
    snprintf(chargers[ci].status, sizeof chargers[ci].status, "%s", status);
    json_charger(out, sizeof out, &chargers[ci]);
    respond(fd, 200, "application/json; charset=utf-8", out);
    return;
  }
  if (!strcmp(method, "POST") && !strncmp(path, "/api/chargers/", 14))
  {
    char *end = strstr(path + 14, "/stop");
    if (!end)
    {
      error_json(fd, 404, "API route not found.");
      return;
    }
    *end = '\0';
    int ci = -1;
    for (int i = 0; i < charger_count; i++)
      if (!strcmp(chargers[i].id, path + 14))
      {
        ci = i;
        break;
      }
    if (ci < 0 || strcmp(chargers[ci].status, "Charging"))
    {
      error_json(fd, 409, "That charger has no active vehicle.");
      return;
    }
    if (history_count >= MAX_HISTORY)
    {
      error_json(fd, 409, "History is full; cannot stop this session yet.");
      return;
    }
    finish_charging(&chargers[ci], "Stopped", now);
    json_session(out, sizeof out, &history[0]);
    respond(fd, 200, "application/json; charset=utf-8", out);
    return;
  }
  if (!strcmp(method, "POST") && !strncmp(path, "/api/queue/", 11))
  {
    char *end = strstr(path + 11, "/assign");
    if (!end)
    {
      error_json(fd, 404, "API route not found.");
      return;
    }
    *end = '\0';
    int qi = -1, ci = -1;
    for (int i = 0; i < queue_count; i++)
      if (!strcmp(queue_items[i].id, path + 11))
      {
        qi = i;
        break;
      }
    if (qi < 0)
    {
      error_json(fd, 404, "Vehicle is not in the queue.");
      return;
    }
    for (int i = 0; i < charger_count; i++)
      if (!strcmp(chargers[i].status, "Available"))
      {
        ci = i;
        break;
      }
    if (ci < 0)
    {
      error_json(fd, 409, "No available chargers right now.");
      return;
    }
    QueueItem q = queue_items[qi];
    for (int i = qi; i < queue_count - 1; i++)
      queue_items[i] = queue_items[i + 1];
    queue_count--;
    Charger *c = &chargers[ci];
    snprintf(c->status, sizeof c->status, "Charging");
    snprintf(c->vehicle, sizeof c->vehicle, "%s", q.id);
    c->power = 120;
    c->minutes = 0;
    c->battery = q.battery;
    c->start_battery = q.battery;
    c->target = q.target;
    c->started_at = time(NULL);
    for (int i = 0; i < vehicle_count; i++)
      if (!strcmp(vehicles[i].id, q.id))
      {
        snprintf(vehicles[i].status, sizeof vehicles[i].status, "Charging");
        vehicles[i].battery = q.battery;
      }
    char vj[512], cj[512];
    json_queue(vj, sizeof vj, &q);
    json_charger(cj, sizeof cj, c);
    snprintf(out, sizeof out, "{\"vehicle\":%s,\"charger\":%s}", vj, cj);
    respond(fd, 200, "application/json; charset=utf-8", out);
    return;
  }
  if (!strcmp(method, "POST") && !strcmp(path, "/api/vehicles"))
  {
    char id[40] = {0}, owner[100] = {0}, model[100] = {0}, connector[30] = {0}, tmp[40] = {0}, arrival[16] = {0};
    value(body, "id", id, sizeof id);
    value(body, "owner", owner, sizeof owner);
    value(body, "model", model, sizeof model);
    value(body, "connector", connector, sizeof connector);
    if (!connector[0])
      snprintf(connector, sizeof connector, "CCS2");
    value(body, "battery", tmp, sizeof tmp);
    int battery = atoi(tmp);
    memset(tmp, 0, sizeof tmp);
    value(body, "capacity", tmp, sizeof tmp);
    char *ep;
    double capacity = strtod(tmp, &ep);
    memset(tmp, 0, sizeof tmp);
    value(body, "target", tmp, sizeof tmp);
    int target = tmp[0] ? atoi(tmp) : 80;
    if (!id[0] || !owner[0] || !model[0] || battery < 0 || battery > 100 || target <= battery || target > 100 || capacity <= 0 || vehicle_count >= MAX_VEHICLES || queue_count >= MAX_QUEUE)
    {
      error_json(fd, 400, "Enter valid vehicle details and a target charge above the current battery level.");
      return;
    }
    for (char *p = id; *p; p++)
      *p = (char)toupper((unsigned char)*p);
    for (int i = 0; i < vehicle_count; i++)
      if (!strcmp(vehicles[i].id, id))
      {
        error_json(fd, 409, "That vehicle ID already exists.");
        return;
      }
    Vehicle *v = &vehicles[vehicle_count++];
    memset(v, 0, sizeof *v);
    snprintf(v->id, sizeof v->id, "%s", id);
    snprintf(v->owner, sizeof v->owner, "%s", owner);
    snprintf(v->model, sizeof v->model, "%s", model);
    snprintf(v->connector, sizeof v->connector, "%s", connector);
    snprintf(v->last, sizeof v->last, "—");
    snprintf(v->status, sizeof v->status, "Queued");
    v->battery = battery;
    v->capacity = capacity;
    QueueItem *q = &queue_items[queue_count++];
    memset(q, 0, sizeof *q);
    snprintf(q->id, sizeof q->id, "%s", id);
    snprintf(q->owner, sizeof q->owner, "%s", owner);
    q->battery = battery;
    q->requested = (int)(capacity + 0.5);
    q->target = target;
    q->arrived_at = time(NULL);
    time_t stamp = q->arrived_at;
    struct tm *local = localtime(&stamp);
    if (local)
      strftime(arrival, sizeof arrival, "%H:%M", local);
    else
      snprintf(arrival, sizeof arrival, "--:--");
    snprintf(q->arrival, sizeof q->arrival, "%s", arrival);
    qsort(queue_items, (size_t)queue_count, sizeof queue_items[0], cmp_queue);
    json_vehicle(out, sizeof out, v);
    respond(fd, 201, "application/json; charset=utf-8", out);
    return;
  }
  error_json(fd, 404, "API route not found.");
}
static void handle(int fd)
{
  char *req = calloc(MAX_REQUEST, 1);
  if (!req)
  {
    close(fd);
    return;
  }
  size_t used = 0;
  while (used < MAX_REQUEST - 1)
  {
    ssize_t n = recv(fd, req + used, MAX_REQUEST - used - 1, 0);
    if (n <= 0)
      break;
    used += (size_t)n;
    req[used] = '\0';
    char *h = strstr(req, "\r\n\r\n");
    if (h)
    {
      size_t have = used - (size_t)(h + 4 - req);
      size_t need = 0;
      char *cl = strstr(req, "Content-Length:");
      if (cl)
        need = (size_t)atoi(cl + 15);
      if (have >= need)
        break;
    }
  }
  char *line = strstr(req, "\r\n");
  if (!line)
  {
    error_json(fd, 400, "Invalid HTTP request.");
    free(req);
    return;
  }
  *line = '\0';
  char method[12] = {0}, path[256] = {0};
  sscanf(req, "%11s %255s", method, path);
  char *query = strchr(path, '?');
  if (query)
    *query = '\0';
  char *body = strstr(line + 2, "\r\n\r\n");
  if (body)
    body += 4;
  else
    body = "";
  if (!strncmp(path, "/api/", 5))
    handle_api(fd, method, path, body);
  else
    serve_file(fd, path);
  free(req);
}
int main(void)
{
  signal(SIGPIPE, SIG_IGN);
  seed();
  const char *port_env = getenv("PORT");
  char *port_end = NULL;
  long port = PORT;
  if (port_env)
  {
    errno = 0;
    port = strtol(port_env, &port_end, 10);
    if (errno || port_end == port_env || *port_end != '\0' || port < 1 || port > 65535)
    {
      fprintf(stderr, "Invalid PORT value: %s\n", port_env);
      return 1;
    }
  }
  int s = socket(AF_INET, SOCK_STREAM, 0);
  if (s < 0)
  {
    perror("socket");
    return 1;
  }
  int yes = 1;
  setsockopt(s, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof yes);
  struct sockaddr_in addr = {0};
  addr.sin_family = AF_INET;
  addr.sin_addr.s_addr = htonl(INADDR_ANY);
  addr.sin_port = htons((unsigned short)port);
  if (bind(s, (struct sockaddr *)&addr, sizeof addr) < 0 || listen(s, 16) < 0)
  {
    perror("bind/listen");
    return 1;
  }
  printf("Charging station backend listening on port %ld\n", port);
  for (;;)
  {
    int client = accept(s, NULL, NULL);
    if (client < 0)
    {
      if (errno == EINTR)
        continue;
      perror("accept");
      continue;
    }
    handle(client);
    close(client);
  }
  close(s);
  return 0;
}
