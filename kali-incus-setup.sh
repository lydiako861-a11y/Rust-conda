#!/bin/bash
# kali-incus-setup.sh
# Creates a split Kali Linux container environment with Agent Hub and Compute Node
# Run as root or with sudo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}[+] Installing Incus if not present...${NC}"
if ! command -v incus &> /dev/null; then
    apt update && apt install -y incus incus-client
    incus admin init --auto
fi

# Create a custom bridge network for internal communication
echo -e "${GREEN}[+] Creating internal bridge 'incus-bridge'...${NC}"
incus network create incus-bridge ipv4.address=10.0.100.1/24 ipv4.nat=true ipv6.address=none

# Create profiles for Agent Hub and Compute Node
echo -e "${GREEN}[+] Creating profiles...${NC}"

# Agent Hub profile (lightweight, access to host's Docker socket)
incus profile create agent-hub 2>/dev/null || true
cat <<EOF | incus profile edit agent-hub
config:
  limits.cpu: "2"
  limits.memory: 2GB
  security.privileged: "true"
  raw.idmap: both 1000 1000
description: Agent Hub profile for orchestration
devices:
  docker-socket:
    path: /var/run/docker.sock
    source: /var/run/docker.sock
    type: disk
  eth0:
    name: eth0
    network: incus-bridge
    type: nic
  root:
    path: /
    pool: default
    type: disk
EOF

# Compute Node profile (high resources, GPU passthrough if available)
incus profile create compute-node 2>/dev/null || true
cat <<EOF | incus profile edit compute-node
config:
  limits.cpu: "8"
  limits.memory: 16GB
  limits.cpu.allowance: 100%
  nvidia.runtime: "true"
  security.privileged: "true"
description: Compute Node profile for heavy workloads
devices:
  eth0:
    name: eth0
    network: incus-bridge
    type: nic
  root:
    path: /
    pool: default
    type: disk
EOF

# Try to add GPU if NVIDIA drivers are present
if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}[+] Detected NVIDIA GPU, adding to compute-node profile...${NC}"
    incus profile device add compute-node gpu gpu
fi

# Launch Agent Hub container
echo -e "${GREEN}[+] Launching Agent Hub container...${NC}"
incus launch images:ubuntu/22.04 agent-hub --profile default --profile agent-hub
incus exec agent-hub -- apt update
incus exec agent-hub -- apt install -y python3-pip docker.io curl
incus exec agent-hub -- systemctl enable docker
incus exec agent-hub -- systemctl start docker

# Launch Compute Node container
echo -e "${GREEN}[+] Launching Compute Node container...${NC}"
incus launch images:kali/kali-rolling compute-node --profile default --profile compute-node
incus exec compute-node -- apt update
incus exec compute-node -- apt install -y python3-pip build-essential git

# Install orchestration tools on Agent Hub
echo -e "${GREEN}[+] Installing orchestration tools on Agent Hub...${NC}"
incus exec agent-hub -- pip3 install flask requests docker kubernetes

# Create a shared directory between containers via Incus filesystem
incus exec agent-hub -- mkdir -p /shared
incus exec compute-node -- mkdir -p /shared
# Bind mount a host directory into both containers (optional)
mkdir -p /var/lib/incus/shared
incus config device add agent-hub shared disk source=/var/lib/incus/shared path=/shared
incus config device add compute-node shared disk source=/var/lib/incus/shared path=/shared

# Get IP addresses for dashboard
AGENT_IP=$(incus list agent-hub -c 4 --format=json | jq -r '.[0].state.network.eth0.addresses[] | select(.family=="inet") | .address')
COMPUTE_IP=$(incus list compute-node -c 4 --format=json | jq -r '.[0].state.network.eth0.addresses[] | select(.family=="inet") | .address')

echo -e "${GREEN}[+] Setup complete!${NC}"
echo -e "Agent Hub IP: ${AGENT_IP}"
echo -e "Compute Node IP: ${COMPUTE_IP}"
echo -e "To access Agent Hub API: http://${AGENT_IP}:5000"
echo -e "Dashboard HTML will connect to these IPs."

# Optionally start a simple API on Agent Hub to receive compute jobs
incus exec agent-hub -- bash -c "cat > /root/api.py << 'EOF'
from flask import Flask, request, jsonify
import subprocess
import json

app = Flask(__name__)

@app.route('/run', methods=['POST'])
def run_job():
    data = request.json
    cmd = data.get('cmd')
    if not cmd:
        return jsonify({'error': 'No command'}), 400
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return jsonify({'stdout': result.stdout, 'stderr': result.stderr})

@app.route('/status', methods=['GET'])
def status():
    return jsonify({'status': 'ok', 'container': 'agent-hub'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
EOF"

incus exec agent-hub -- nohup python3 /root/api.py > /dev/null 2>&1 &

echo -e "${GREEN}[+] Agent Hub API started on port 5000${NC}"
