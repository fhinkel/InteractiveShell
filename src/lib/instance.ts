export interface Instance {
  host: string;
  port: string;
  username: string;
  sshKey: string;
  containerName?: string;
  lastActiveTime?: number;
  containerId?: string;
  killNotify?: () => void;
}
