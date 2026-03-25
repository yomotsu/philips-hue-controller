export interface Light {
  id: string;
  name: string;
  on: boolean;
  reachable: boolean;
  archetype?: string;
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

export interface SwitchBotDevice {
  id: string;
  name: string;
  on: boolean;
  type: string;
}
