import { Client } from 'ssh2';
import { createServer, type Server } from 'node:net';
import { readFileSync } from 'node:fs';
import type { SshConfig } from '../../shared/config.js';

export class SshTunnel {
  private sshClient: Client | null = null;
  private localServer: Server | null = null;

  async open(config: SshConfig, targetHost: string, targetPort: number): Promise<number> {
    const privateKey = readFileSync(config.keyPath, 'utf-8');

    return new Promise<number>((resolve, reject) => {
      const client = new Client();
      this.sshClient = client;

      client.on('ready', () => {
        const server = createServer((sock) => {
          client.forwardOut(
            '127.0.0.1',
            sock.localPort ?? 0,
            targetHost,
            targetPort,
            (err, stream) => {
              if (err) {
                sock.destroy();
                return;
              }
              sock.pipe(stream).pipe(sock);
            },
          );
        });

        this.localServer = server;

        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          if (addr && typeof addr !== 'string') {
            resolve(addr.port);
          } else {
            reject(new Error('Failed to get local tunnel port'));
          }
        });

        server.on('error', reject);
      });

      client.on('error', reject);

      client.connect({
        host: config.host,
        port: config.port,
        username: config.user,
        privateKey,
      });
    });
  }

  async close(): Promise<void> {
    if (this.localServer) {
      await new Promise<void>((resolve) => {
        this.localServer!.close(() => resolve());
      });
      this.localServer = null;
    }

    if (this.sshClient) {
      this.sshClient.end();
      this.sshClient = null;
    }
  }
}
