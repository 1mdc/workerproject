import axios from "axios";

export interface Peon {
    peon_id: number;
    owner: string;
    efficiency: BigInt;
    transfers: PeonTransfer[];
    purchases: PeonPurchase[];
    bids: PeonBid[];
    created_at: Date;
}

interface PeonTransfer {
    from: string;
    to: string;
    time: Date;
}

interface PeonPurchase {
    from: string;
    to: string;
    value: BigInt;
    time: Date;
}

interface PeonBid {
    buyer: string;
    value: BigInt;
    time: Date;
}

interface PeonCountDto {
    peons: number;
}

const client = axios
const backendEndpoint = process.env.REACT_APP_BACKEND_ENDPOINT || "";

export function getPeonCount(): Promise<number> {
    return client.get<PeonCountDto>(`${backendEndpoint}/count-peons`).then(resp => resp.data.peons);
}

export function getOwnerPeons(address: string): Promise<number[]> {
    return client.get<number[]>(`${backendEndpoint}/owned-peons/${address}`).then(resp => resp.data);
}

export function getLastMintedPeons(): Promise<number[]> {
    return client.get<number[]>(`${backendEndpoint}/peons`).then(resp => resp.data);
}

export function getPeonDetail(peonId: number): Promise<Peon> {
    return client.get<Peon>(`${backendEndpoint}/peons/${peonId}`).then(resp => resp.data);
}

export function getBids(address: string): Promise<number[]> {
    return client.get<number[]>(`${backendEndpoint}/bids/${address}`).then(resp => resp.data);
}

export function getRandomPeons(): Promise<number[]> {
    return client.get<number[]>(`${backendEndpoint}/market`).then(resp => resp.data);
}

