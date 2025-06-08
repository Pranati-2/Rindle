# Rindle Docker Setup Guide

This guide explains how to set up and run the Rindle application and its PostgreSQL database using Docker. This setup is ideal for local development and testing.

## Prerequisites
- **Docker Desktop:** Installed and running on your system (Windows, macOS, or Linux). Download from [Docker's website](https://www.docker.com/products/docker-desktop/).
- **Git:** For cloning the repository.
- **A terminal or command prompt.**

## 1. Clone the Repository
If you haven't already, clone the Rindle repository to your local machine:
```bash
git clone <your_repository_url> # Replace <your_repository_url> with the actual Git repo URL
cd rindle # Navigate into the project directory
```

## 2. Create a Docker Network
It's best practice to run containers on a user-defined bridge network to enable easy service discovery by container name.
```bash
docker network create rindle-net
```
This command creates a new Docker network named `rindle-net`.

## 3. Setup PostgreSQL Database Container
Run a PostgreSQL container on the `rindle-net` network. This container will be named `rindle-db`.
```bash
docker run -d \
  --name rindle-db \
  --network rindle-net \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=rindle_db \
  -p 5432:5432 \
  -v rindle_db_data:/var/lib/postgresql/data \
  postgres:15-alpine
```
Breakdown of the command:
- `-d`: Run the container in detached mode (in the background).
- `--name rindle-db`: Assigns the name "rindle-db" to the container. This is how the application container will find it.
- `--network rindle-net`: Connects the container to the `rindle-net` network.
- `-e POSTGRES_USER=postgres`: Sets the PostgreSQL superuser username to `postgres`.
- `-e POSTGRES_PASSWORD=mysecretpassword`: Sets the password for the `postgres` user. **Choose a strong password for production environments.**
- `-e POSTGRES_DB=rindle_db`: Creates an initial database named `rindle_db`.
- `-p 5432:5432`: Maps port 5432 on your host machine to port 5432 in the container, allowing you to connect to the database from your host if needed (e.g., with a GUI tool).
- `-v rindle_db_data:/var/lib/postgresql/data`: Creates a Docker volume named `rindle_db_data` and mounts it to the PostgreSQL data directory. This ensures your database data persists even if the container is removed and recreated.
- `postgres:15-alpine`: Specifies the Docker image to use (PostgreSQL version 15, Alpine Linux variant).

You can check if the database container is running:
```bash
docker ps
```
You should see `rindle-db` in the list.

## 4. Configure Environment Variables for Rindle
The application uses a `.env` file for configuration.
1.  **Create a `.env` file from the example:**
    ```bash
    cp .env.example .env
    ```
2.  **Verify `DATABASE_URL` in `.env`:**
    Open the newly created `.env` file. The default `DATABASE_URL` in `.env.example` is:
    ```
    DATABASE_URL="postgresql://postgres:mysecretpassword@rindle-db:5432/postgres"
    ```
    - **For this setup, you need to change the database name from `postgres` to `rindle_db` to match what was created in the `docker run` command for `rindle-db`:**
      ```
      DATABASE_URL="postgresql://postgres:mysecretpassword@rindle-db:5432/rindle_db"
      ```
    - **Explanation:**
        - `postgres`: The username set with `POSTGRES_USER`.
        - `mysecretpassword`: The password set with `POSTGRES_PASSWORD`.
        - `rindle-db`: The hostname. This is the name of the PostgreSQL container (`--name rindle-db`) and is resolvable because both containers will be on the same Docker network (`rindle-net`).
        - `5432`: The port PostgreSQL is listening on inside its container.
        - `rindle_db`: The database name set with `POSTGRES_DB`.

    The `PORT` variable (e.g., `PORT=5000`) in the `.env` file is used by the application server inside the container.

## 5. Build the Rindle Application Docker Image
From the root of the project directory (where the `Dockerfile` is located):
```bash
docker build -t rindle-app .
```
- `-t rindle-app`: Tags the image with the name "rindle-app".
- `.`: Specifies the current directory as the build context.

This process can take a few minutes, especially the first time, as it downloads base images and installs dependencies.

## 6. Run the Rindle Application Container
Now, run the Rindle application container, connecting it to the same network as the database:
```bash
docker run -d \
  --name rindle-app-instance \
  --network rindle-net \
  -p 5000:5000 \
  --env-file .env \
  rindle-app
```
Breakdown of the command:
- `-d`: Run in detached mode.
- `--name rindle-app-instance`: Names this specific container instance.
- `--network rindle-net`: Connects the container to the `rindle-net` network, allowing it to communicate with `rindle-db` by its name.
- `-p 5000:5000`: Maps port 5000 on your host to port 5000 in the container (where the Rindle server listens, as defined by `ENV PORT` in the Dockerfile and `.env`).
- `--env-file .env`: Loads environment variables from your `.env` file (most importantly, `DATABASE_URL`).
- `rindle-app`: The name of the Docker image to run.

You can check the logs of the application container:
```bash
docker logs rindle-app-instance
```

## 7. Run Database Migrations
Once the application container is running, apply database migrations using Drizzle Kit. The `package.json` should have a script for `db:push` or similar. We execute this command inside the running `rindle-app-instance` container:
```bash
docker exec -it rindle-app-instance npx drizzle-kit push:pg
```
- `docker exec -it rindle-app-instance`: Executes a command in the running container.
- `npx drizzle-kit push:pg`: The command to apply schema changes to the PostgreSQL database. Ensure your `drizzle.config.ts` is correctly set up to use `DATABASE_URL` from the environment.

If successful, you'll see output indicating the schema has been pushed to the database.

## 8. Access the Application
Open your web browser and navigate to:
[http://localhost:5000](http://localhost:5000)

You should see the Rindle application.

## 9. Stopping and Cleaning Up

**To stop the application and database containers:**
```bash
docker stop rindle-app-instance
docker stop rindle-db
```

**To remove the containers (after stopping them):**
```bash
docker rm rindle-app-instance
docker rm rindle-db
```

**To remove the Docker network (if no containers are using it):**
```bash
docker network rm rindle-net
```

**To remove the Docker volume (this will delete all database data):**
If you want to completely reset your database:
```bash
docker volume rm rindle_db_data
```

**To remove the Docker image for the application:**
```bash
docker rmi rindle-app
```

## Troubleshooting
- **Connection Issues:** If the app can't connect to the database, double-check:
    - Both containers are on the `rindle-net` network (`docker inspect rindle-db` and `docker inspect rindle-app-instance` will show network details).
    - The `DATABASE_URL` in your `.env` file (and thus used by `rindle-app-instance`) correctly uses `rindle-db` as the hostname and matches the user, password, and database name used when starting `rindle-db`.
    - PostgreSQL container (`rindle-db`) is running and healthy (`docker ps`, `docker logs rindle-db`).
- **Port Conflicts:** If port `5000` or `5432` is already in use on your host, you'll need to change the host-side port mapping in the `docker run` commands (e.g., `-p 5001:5000`). Remember to update the access URL accordingly.
- **Migration Failures:** Check the output of the `drizzle-kit push:pg` command and the application logs for database-related errors. Ensure `drizzle.config.ts` correctly sources the `DATABASE_URL`.
```
