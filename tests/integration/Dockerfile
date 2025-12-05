FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Install dnsmasq and mkcert
RUN apt-get update && \
    apt-get install -y make build-essential libnss3-tools ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install mkcert
RUN wget -O /usr/local/bin/mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 && \
    chmod +x /usr/local/bin/mkcert

# Install mkcert certificates
RUN mkcert -install

RUN update-ca-certificates
