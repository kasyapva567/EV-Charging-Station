# Charging station backend

Run from this project folder:

```sh
cc -std=c11 -O2 backend.c -o charging-station-server-v3
./charging-station-server-v3
```

The C server serves the UI from `front-end/` at http://127.0.0.1:3000. It simulates charging progress, and the Live Charger Status panel includes pulsing progress and a Manage chargers dialog. Charger status changes are held in memory and reset when the server restarts.
