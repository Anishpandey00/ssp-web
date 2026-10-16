# Temporary Azure demonstration

This guide runs the existing three application containers on one Ubuntu VM.
Caddy runs as a host service to provide HTTPS. It is not a fourth Docker container.
This is a small classroom demonstration, not a highly available production setup.

## Before creating resources

- Confirm the GitHub branch contains `deploy/azure/compose.yaml` and `server/admin-seed.js`.
- Use a dedicated resource group, such as `ssp-demo-rg`, containing only this demo.
- Select Ubuntu Server 24.04 LTS, an available small B-series size (prefer 2 vCPU
  and 4 GiB RAM for building and running the app), and a Standard SSD OS disk.
  Check the actual region, SKU availability, credit eligibility, and portal price.
- Avoid paid extras such as Bastion, a load balancer, a container registry,
  managed PostgreSQL, or paid Defender plans for this temporary demonstration.
- Set a daily Azure VM auto-shutdown time after the planned presentation.
  Confirm the displayed time zone. Do not rely on shutting down inside Ubuntu.
- Set a small cost budget alert. Budget alerts are notifications, not a hard cap;
  reported costs can lag. Agree a spending target before creating the VM.
- Use SSH key authentication. Allow port 22 only from your current public IP.
  Allow inbound TCP 80 and 443 for the website and certificate validation.
  Do not open 3000, 4000, 5432, or 9001 publicly.
- Add a unique DNS name label to the VM public IP, and record the exact resulting
  fully qualified domain name shown by Azure.

## Prepare the Ubuntu VM

Connect using the SSH command shown by Azure. Install Docker Engine, Buildx,
and the Compose plugin using the official Ubuntu installation guide:

https://docs.docker.com/engine/install/ubuntu/

Install Caddy using its official stable Debian/Ubuntu package instructions:

https://caddyserver.com/docs/install#debian-ubuntu-raspbian

Install Git and Python if needed:

```bash
sudo apt-get update
sudo apt-get install -y git python3
git clone https://github.com/Anishpandey00/ssp-web.git
cd ssp-web
python3 scripts/create-demo-env.py
```

The script creates `.env.azure` with random credentials and permissions `600`.
It refuses to overwrite an existing file. Keep it private; it is ignored by Git.
Use a fresh cloud database. Do not upload your local `.env` or database volume.
Existing local administrator accounts are not modified by this deployment.

## Start the three containers

Run from the repository root:

```bash
sudo docker compose --env-file .env.azure -f deploy/azure/compose.yaml up -d --build --wait
sudo docker compose --env-file .env.azure -f deploy/azure/compose.yaml ps
curl --fail http://127.0.0.1:3000/api/health
```

The frontend listens only on the VM loopback interface. The backend and database
are reachable only on the Docker network. Docker logs are rotated to limit disk use.

## Enable the public HTTPS address

Copy `deploy/azure/Caddyfile.example` to `/etc/caddy/Caddyfile` with `sudo`.
Replace the example hostname with the exact Azure public-IP DNS name. Keep
`reverse_proxy 127.0.0.1:3000`. Then run:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

DNS must resolve to this VM and inbound ports 80/443 must be reachable for
certificate issuance. Open `https://YOUR-AZURE-DNS-NAME` only after HTTPS succeeds.
Do not bypass browser certificate warnings.

Verify `/api/health` returns `{"ok":true}` through the HTTPS address. Register a
dummy student, add and complete a task, and take a quiz. Read the generated admin
credentials privately from `.env.azure` to demonstrate the admin interface.
Use demonstration data rather than real student information.

## Restart and update

After restarting the VM, Docker and Caddy services should start automatically;
the containers use `restart: unless-stopped`. Verify their state with the `ps`
command above. After pushing source changes:

```bash
git pull --ff-only
sudo docker compose --env-file .env.azure -f deploy/azure/compose.yaml up -d --build --wait
```

Use the same Compose file and environment file every time. Do not run the local
Compose file on this VM, since it has different port mappings and volume names.

## Limit spending after the demonstration

In Azure, select the VM's **Stop** action and verify **Stopped (deallocated)**.
This stops VM compute charges, but disks and public IP/network resources may still
cost money. Stopping containers alone does not stop VM billing.

When the demonstration is finished and its cloud data is no longer needed,
delete the dedicated `ssp-demo-rg` resource group in Azure. Review its resources
first: deleting it removes the VM, disks, and demo database data permanently.
Check Azure Cost Management afterward for remaining resources and delayed charges.
This guide does not automatically delete anything or schedule a shutdown.

Official billing and budget references:

- https://learn.microsoft.com/en-us/azure/virtual-machines/states-billing
- https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets

