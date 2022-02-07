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
import { Contribution, Sale, WhitelistedPerson } from "../generated/schema";

// - event: WhitelistedRemoved(indexed address)
// handler: handleWhitelistedRemoved
export function handleTokensPurchased(event: TokensPurchased): void {
  let sale = Sale.load(event.address.toHex());
  let contributionId = event.address.toHex().concat("-").concat(event.params.beneficiary.toHex());
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

  sale.weiRaised = sale.weiRaised.plus(event.params.value);
  sale.save();
}

export function handleTokensClaimed(event: TokensClaimed): void {
  let contributionId = event.address.toHex().concat("-").concat(event.params.beneficiary.toHex());
  let contribution = Contribution.load(contributionId)
  if (contribution !== null) {
    contribution.claimed = true;
    contribution.save();
  }
}

export function handleClaimRefunded(event: ClaimRefunded): void {
  let contributionId = event.address.toHex().concat("-").concat(event.params.beneficiary.toHex());
  let contribution = Contribution.load(contributionId)
  if (contribution !== null) {
    contribution.refunded = true;
    contribution.save();
  }
}

export function handleTokensDeposited(event: TokensDeposited): void {
  let sale = Sale.load(event.address.toHex());
  if (sale !== null) {
    sale.deposited = true;
    sale.save();
  }
}

export function handleCrowdsaleFinalized(event: CrowdsaleFinalized): void {
  let sale = Sale.load(event.address.toHex());
  if (sale !== null) {
    sale.finalized = true;
    sale.save();
  }
}

export function handleCrowdsaleCanceled(event: CrowdsaleCanceled): void {
  let sale = Sale.load(event.address.toHex());
  if (sale !== null) {
    sale.canceled = true;
    sale.save();
  }
}

export function handleWhitelistedAdded(event: WhitelistedAdded): void {
  let sale = Sale.load(event.address.toHex());
  if (sale !== null) {
    let whitelistId = event.address.toHex().concat("-").concat(event.params.account.toHex());
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
  let sale = Sale.load(event.address.toHex());
  if (sale !== null) {
    let whitelistId = event.address.toHex().concat("-").concat(event.params.account.toHex());
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