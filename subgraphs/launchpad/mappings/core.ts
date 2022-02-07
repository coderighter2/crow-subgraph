/* eslint-disable prefer-const */
import { BigInt, BigDecimal, store, Address } from "@graphprotocol/graph-ts";
import {
  TokensClaimed,
  TokensDeposited,
  TokensPurchased,
  ClaimRefunded,
  CrowdsaleFinalized,
  CrowdsaleCanceled,
  WhitelistedAdded,
  WhitelistedRemoved
} from "../generated/SaleFactory/Sale";
import { Contribution, WhitelistedPerson } from "../generated/schema";
import { ADDRESS_ZERO, retreiveSale } from "./utils";

// - event: WhitelistedRemoved(indexed address)
// handler: handleWhitelistedRemoved
export function handleTokensPurchased(event: TokensPurchased): void {
  const sale = retreiveSale(event.address, Address.fromString(ADDRESS_ZERO));
  const contributionId = event.address.toHex().concat("-").concat(event.params.beneficiary.toHex());
  let contribution = Contribution.load(contributionId)
  if (contribution == null) {
    contribution = new Contribution(contributionId);
    contribution.sale = sale.id;
    contribution.amount = event.params.value;
    contribution.contributor = event.params.beneficiary;
    contribution.claimed = false;
    contribution.refunded = false;
  } else {
    contribution.amount = contribution.amount.plus(event.params.value);
  }
  contribution.save();
}

export function handleTokensClaimed(event: TokensClaimed): void {
  const contributionId = event.address.toHex().concat("-").concat(event.params.beneficiary.toHex());
  const contribution = Contribution.load(contributionId)
  if (contribution !== null) {
    contribution.claimed = true;
    contribution.save();
  }
}

export function handleClaimRefunded(event: ClaimRefunded): void {
  const contributionId = event.address.toHex().concat("-").concat(event.params.beneficiary.toHex());
  const contribution = Contribution.load(contributionId)
  if (contribution !== null) {
    contribution.refunded = true;
    contribution.save();
  }
}

export function handleTokensDeposited(event: TokensDeposited): void {
  const sale = retreiveSale(event.address, Address.fromString(ADDRESS_ZERO));
  if (sale !== null) {
    sale.deposited = true;
    sale.save();
  }
}

export function handleCrowdsaleFinalized(event: CrowdsaleFinalized): void {
  const sale = retreiveSale(event.address, Address.fromString(ADDRESS_ZERO));
  if (sale !== null) {
    sale.finalized = true;
    sale.save();
  }
}

export function handleCrowdsaleCanceled(event: CrowdsaleCanceled): void {
  const sale = retreiveSale(event.address, Address.fromString(ADDRESS_ZERO));
  if (sale !== null) {
    sale.canceled = true;
    sale.save();
  }
}

export function handleWhitelistedAdded(event: WhitelistedAdded): void {
  const sale = retreiveSale(event.address, Address.fromString(ADDRESS_ZERO));
  if (sale !== null) {
    const whitelistId = event.address.toHex().concat("-").concat(event.params.account.toHex());
    let whitelistedPerson = WhitelistedPerson.load(whitelistId)
    if (whitelistedPerson == null) {
      whitelistedPerson = new WhitelistedPerson(whitelistId)
      whitelistedPerson.sale = sale.id;
      whitelistedPerson.contributor = event.params.account;
    }
    whitelistedPerson.whitelisted = true;
    whitelistedPerson.save();
  }
}

export function handleWhitelistedRemoved(event: WhitelistedRemoved): void {
  const sale = retreiveSale(event.address, Address.fromString(ADDRESS_ZERO));
  if (sale !== null) {
    const whitelistId = event.address.toHex().concat("-").concat(event.params.account.toHex());
    let whitelistedPerson = WhitelistedPerson.load(whitelistId)
    if (whitelistedPerson == null) {
      whitelistedPerson = new WhitelistedPerson(whitelistId)
      whitelistedPerson.sale = sale.id;
      whitelistedPerson.contributor = event.params.account;
    }
    whitelistedPerson.whitelisted = false;
    whitelistedPerson.save();
  }
}