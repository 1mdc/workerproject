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

export function getPeonCount(): Promise<number> {
    return client.get<PeonCountDto>("http://localhost:8080/count-peons").then(resp => resp.data.peons);
}

export function getOwnerPeons(address: string): Promise<number[]> {
    return client.get<number[]>(`http://localhost:8080/owned-peons/${address}`).then(resp => resp.data);
}

export function getLastMintedPeons(): Promise<number[]> {
    return client.get<number[]>(`http://localhost:8080/peons`).then(resp => resp.data);
}

export function getPeonDetail(peonId: number): Promise<Peon> {
    return client.get<Peon>(`http://localhost:8080/peons/${peonId}`).then(resp => resp.data);
}

export function getBiddings(address: string): Promise<number[]> {
    return client.get<number[]>(`http://localhost:8080/bidding-peons/${address}`).then(resp => resp.data);
}

export function getRandomPeons(): Promise<number[]> {
    return client.get<number[]>(`http://localhost:8080/market`).then(resp => resp.data);
}

