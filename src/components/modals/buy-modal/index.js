/* eslint-disable react/forbid-prop-types */
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
  getAvailableUtxosWithoutInscription,
  generatePSBTListingInscriptionForBuy,
  generateDeezyPSBTListingForBuy,
  getAvailableUtxosWithoutDummies,
  signPsbtMessage,
  broadcastTx,
  TESTNET,
  NETWORK,
  shortenStr,
  satsToFormattedDollarString,
  signPsbtListingForBuy,
} from "@services/nosft";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { TailSpin } from "react-loading-icons";
import { toast } from "react-toastify";
import { InscriptionPreview } from "@components/inscription-preview";
import { NostrEvenType } from "@utils/types";
import TransactionSent from "@components/transaction-sent-confirmation";
import { useDelayUnmount } from "@hooks";
import clsx from "clsx";
import { useWallet } from "@context/wallet-context";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";
import axios from "axios";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

bitcoin.initEccLib(ecc);

const BuyModal = ({ show, handleModal, utxo, onSale, nostr }) => {
  const { nostrOrdinalsAddress, nostrPaymentsAddress, ordinalsPublicKey } =
    useWallet();
  const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
  const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
  const [destinationBtcAddress, setDestinationBtcAddress] =
    useState(nostrPaymentsAddress);
  const [ordinalValue, setOrdinalValue] = useState(utxo.value);
  const [isOnBuy, setIsOnBuy] = useState(false);
  const [selectedUtxos, setSelectedUtxos] = useState([]);
  const [deezyPsbtPopulate, setDeezyPsbtPopulate] = useState(null);
  const [buyTxId, setBuyTxId] = useState(null);

  const [isMounted, setIsMounted] = useState(true);
  const showDiv = useDelayUnmount(isMounted, 500);
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });

  const updatePayerAddress = async (address) => {
    try {
      let deezyPsbt;
      if (!deezyPsbtPopulate) {
        const { data } = await axios.post(
          `https://api${
            TESTNET ? "-testnet" : ""
          }.deezy.io/v1/ordinals/psbt/populate`,
          {
            psbt: nostr.content, // (hex or base64)
            ordinal_receive_address: address,
          }
        );

        const { psbt } = data;
        deezyPsbt = bitcoin.Psbt.fromHex(psbt, {
          network: NETWORK,
        });

        setDeezyPsbtPopulate(data);
      } else {
        const { psbt } = deezyPsbtPopulate;
        deezyPsbt = bitcoin.Psbt.fromHex(psbt, {
          network: NETWORK,
        });
      }

      const { selectedUtxos: _selectedUtxos, dummyUtxos } =
        await getAvailableUtxosWithoutDummies({
          address,
          price: utxo.value,
          psbt: deezyPsbt,
        });

      if (dummyUtxos.length < 2) {
        throw new Error(
          "No dummy UTXOs found. Please create them before continuing."
        );
      }

      setSelectedUtxos(_selectedUtxos);
    } catch (e) {
      setSelectedUtxos([]);
      throw e;
    }
  };

  const onChangeAddress = async (evt) => {
    const newaddr = evt.target.value;
    if (newaddr === "") {
      setIsBtcInputAddressValid(true);
      return;
    }
    if (!validate(newaddr, TESTNET ? Network.testnet : Network.mainnet)) {
      setIsBtcInputAddressValid(false);
      return;
    }
    setDestinationBtcAddress(newaddr);
  };

  useEffect(() => {
    setDestinationBtcAddress(nostrPaymentsAddress);

    const updateAddress = async () => {
      setIsOnBuy(true);
      try {
        await updatePayerAddress(nostrPaymentsAddress);
      } catch (e) {
        if (e.message.includes("Not enough cardinal spendable funds")) {
          toast.error(e.message);
          return;
        }

        setIsBtcInputAddressValid(false);
        toast.error(e.message);
        return;
      }

      setIsOnBuy(false);
    };

    updateAddress();
  }, [nostrPaymentsAddress]);

  const buy = async () => {
    setIsOnBuy(true);

    try {
      await updatePayerAddress(destinationBtcAddress);
    } catch (e) {
      setIsBtcInputAddressValid(false);
      toast.error(e.message);
      return;
    }

    debugger;

    try {
      const sellerSignedPsbt = bitcoin.Psbt.fromBase64(nostr.content, {
        network: NETWORK,
      });

      // Step 1 happens above, when we call deezy api to get the psbt with the dummy utxos.
      const { psbt, id } = deezyPsbtPopulate;
      const deezyPsbt = bitcoin.Psbt.fromHex(psbt, {
        network: NETWORK,
      });

      // Step 2, we add our payment data
      const { psbt: psbtForBuy } = await generateDeezyPSBTListingForBuy({
        payerAddress: destinationBtcAddress,
        receiverAddress: nostrOrdinalsAddress,
        price: nostr.value,
        paymentUtxos: selectedUtxos,
        sellerSignedPsbt,
        psbt: deezyPsbt,
        id,
        pubKey: ordinalsPublicKey,
      });

      // Step 3, we sign the psbt
      const signedPsbt = await signPsbtListingForBuy({
        psbt: psbtForBuy,
        id,
        ordinalAddress: nostrOrdinalsAddress,
        payerAddress: destinationBtcAddress,
      });

      // Step 4, we finalize the psbt and broadcast it
      const { data: finalizeData } = await axios.post(
        `https://api${
          TESTNET ? "-testnet" : ""
        }.deezy.io/v1/ordinals/psbt/finalize`,
        {
          psbt: signedPsbt, // (hex or base64)
          id,
        }
      );

      const { txid: txId } = finalizeData;

      setBuyTxId(txId);
      toast.info(`Order successfully signed! ${txId}`);
      navigator.clipboard.writeText(txId);

      // Display confirmation component
      setIsMounted(!isMounted);
    } catch (e) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsOnBuy(false);
    }
  };

  const closeModal = () => {
    onSale();
    handleModal();
  };

  const submit = async () => {
    if (!destinationBtcAddress) return;
    if (!isBtcAmountValid) return;
    if (!isBtcInputAddressValid) return;

    await buy();
  };

  const renderBody = () => {
    if (!showDiv) {
      return (
        <div className="show-animated">
          <TransactionSent
            txId={buyTxId}
            onClose={closeModal}
            title="Transaction Sent"
          />
        </div>
      );
    }

    return (
      <div className={clsx(!isMounted && "hide-animated")}>
        <p>You are about to buy this Ordinal</p>
        <div className="inscription-preview">
          <InscriptionPreview utxo={utxo} />
        </div>

        <div className="placebid-form-box">
          <div className="bid-content">
            <div className="bid-content-top">
              <div className="bid-content-left">
                <InputGroup className="mb-lg-5 notDummy">
                  <Form.Label>Address to receive payment</Form.Label>
                  <Form.Control
                    defaultValue={nostrPaymentsAddress}
                    onChange={onChangeAddress}
                    placeholder="Buyer address"
                    aria-label="Buyer address"
                    aria-describedby="basic-addon2"
                    isInvalid={!isBtcInputAddressValid}
                    autoFocus
                  />

                  <Form.Control.Feedback type="invalid">
                    <br />
                    No dummy UTXOs found for your address
                  </Form.Control.Feedback>
                </InputGroup>
              </div>
            </div>

            <div className="bid-content-mid">
              <div className="bid-content-left">
                {Boolean(destinationBtcAddress) && (
                  <span>Payment Receive Address</span>
                )}

                {Boolean(nostr?.value) && <span>Price</span>}
              </div>
              <div className="bid-content-right">
                {Boolean(destinationBtcAddress) && (
                  <span>{shortenStr(destinationBtcAddress)}</span>
                )}
                {Boolean(nostr?.value) && Boolean(bitcoinPrice) && (
                  <span>{`$${satsToFormattedDollarString(
                    nostr.value,
                    bitcoinPrice
                  )}`}</span>
                )}
              </div>
            </div>
          </div>

          <div className="bit-continue-button notDummy">
            <Button
              size="medium"
              fullwidth
              disabled={!destinationBtcAddress}
              autoFocus
              className={isOnBuy ? "btn-loading" : ""}
              onClick={submit}
            >
              {isOnBuy ? <TailSpin stroke="#fec823" speed={0.75} /> : "Buy"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      className="rn-popup-modal placebid-modal-wrapper"
      show={show}
      onHide={handleModal}
      centered
    >
      {show && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={handleModal}
        >
          <i className="feather-x" />
        </button>
      )}
      {showDiv && (
        <Modal.Header>
          <h3 className={clsx("modal-title", !isMounted && "hide-animated")}>
            Buy {shortenStr(utxo && `${utxo.inscriptionId}`)}
          </h3>
        </Modal.Header>
      )}
      <Modal.Body>{renderBody()}</Modal.Body>
    </Modal>
  );
};

BuyModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  utxo: PropTypes.object,
  onSale: PropTypes.func,
  nostr: NostrEvenType,
};
export default BuyModal;
