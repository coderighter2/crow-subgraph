/* eslint-disable prefer-const */
import { SaleFactory, Sale } from "../generated/schema";
import { NewSaleCreated } from "../generated/SaleFactory/SaleFactory";
import {
  FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  retreiveSale,
} from "./utils";

export function handleSaleCreated(event: NewSaleCreated): void {
  const sale = retreiveSale(event.params.deployed, event.params.from);
}
