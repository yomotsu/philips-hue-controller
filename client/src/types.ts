export interface Light {
  id: string;
  name: string;
  on: boolean;
  reachable: boolean;
}

export interface Room {
  id: string;
  name: string;
  lightIds: string[];
  anyOn: boolean;
}

export interface BridgeStatus {
  configured: boolean;
  bridgeIp?: string;
}
