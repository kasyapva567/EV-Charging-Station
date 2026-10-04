# Charging station app

## Run locally

```sh
cc -std=c11 -O2 back-end/backend.c -o back-end/charging-station-server-v3
cd back-end
./charging-station-server-v3
```

The C server serves the frontend and API from http://127.0.0.1:3000. To use VS Code Live Server on port 5500 during development, also run the C server; the frontend uses it as its API.

## Deploy to Render

The repository includes a root-level `Dockerfile` that builds the C server and packages the frontend. Deploy it as a single Render Web Service so the frontend and `/api` share one origin.

1. Push the repository, including `Dockerfile`, to GitHub.
2. In Render, choose **New > Web Service** and connect the repository.
3. Select **Docker** as the runtime and use `./Dockerfile` as the Dockerfile path.
4. Choose a region and instance plan, then create the service.
5. Wait for the deployment to finish and open the Render URL. Verify that `/` loads the dashboard and `/api/state` returns JSON.

The server listens on Render's `PORT` environment variable and binds to all network interfaces. Locally, it defaults to port 3000.

## Limitations

Application state is kept in memory and resets whenever the server restarts or redeploys. Render's free web services can spin down while idle, so the first request afterward may take longer. Add persistent database storage before relying on this app for durable data. The dashboard currently has no authentication; do not expose real station controls publicly until access control is added.

The server simulates charging progress. Charger status changes are held in memory and reset when the server restarts. Vehicle IDs must be unique across the shared live fleet, including the demo vehicles.
