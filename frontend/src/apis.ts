import {Axios} from "axios";

export interface Peon {
    peon_id: number;
    owner: string;
    transfers: PeonTransfer[];
    purchases: PeonPurchase[];
    bids: PeonBid[];
    transferred_at: Date;
    created_at: Date;
}

interface PeonTransfer {
    from: string;
    to: string;
}

interface PeonPurchase {
    from: string;
    to: string;
    value: BigInt;
}

interface PeonBid {
    buyer: string;
    value: BigInt;
}

interface PeonCountDto {
    peons: number;
}

const client = new Axios();

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

