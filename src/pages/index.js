/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue */

import React, { useState, useEffect } from "react";

import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import HeroArea from "@containers/HeroArea";
import OrdinalsArea from "@containers/OrdinalsArea";
import { normalizedData, deepClone } from "@utils/methods";
import { getAddressInfo } from "@utils/crypto";
import { DEFAULT_FEE_RATE, INSCRIPTION_SEARCH_DEPTH } from "@lib/constants";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

import ordinalsData from "@data/ordinals.json"; // TODO: Replace with FETCH of pub key
import homepageData from "@data/general/home.json";

// Use this to fetch data from an API service
const axios = require("axios");

export async function getStaticProps() {
    return { props: { className: "template-color-1" } };
}

const App = () => {
    const [nostrPublicKey, setNostrPublicKey] = useState();
    const [ownedUtxos, setOwnedUtxos] = useState([]);
    const [utxosReady, setUtxosReady] = useState(false);
    const [inscriptionUtxosByUtxo, setInscriptionUtxosByUtxo] = useState({});
    const [nostrAddress, setNostrAddress] = useState();

    useEffect(() => {
        // TODO: Move this to a service and encapulate the logic correctly
        async function fetchUtxosForAddress() {
            if (!nostrPublicKey) return;

            // TODO: USE PUB KEY NOT HARDCODED DANNY
            const { address } = getAddressInfo(nostrPublicKey);
            setNostrAddress(address);

            const response = await axios.get(
                `https://mempool.space/api/address/${address}/utxo`
            );
            const tempInscriptionsByUtxo = {};

            setOwnedUtxos(response.data);
            // TODO: Move to promise.all
            // TODO: Order if possible, so that we can get the most recent inscriptions first
            // TODO: Can we remove inscriptions without images?
            for (const utxo of response.data) {
                tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = utxo;
                // if (!utxo.status.confirmed) continue
                let currentUtxo = utxo;
                let currentDepth = 0;
                // console.log(utxo);
                while (true) {
                    if (currentDepth > INSCRIPTION_SEARCH_DEPTH) break;
                    // console.log(`looping ${currentDepth}`);
                    const inscriptionId = `${currentUtxo.txid}i${currentUtxo.vout}`;
                    // If there's no inscription here, go back one vin and check again.
                    // console.log(`Checking inscription id ${inscriptionId}`);
                    let res = null;
                    try {
                        res = await axios.get(
                            `https://ordinals.com/inscription/${inscriptionId}`
                        );
                    } catch (err) {
                        console.error(`Error from ordinals.com`);
                    }
                    if (!res) {
                        // console.log(`No inscription for ${inscriptionId}`);
                        currentDepth += 1;
                        // get previous vin
                        const txResp = await axios.get(
                            `https://mempool.space/api/tx/${currentUtxo.txid}`
                        );
                        const tx = txResp.data;
                        // console.log(tx);
                        const firstInput = tx.vin[0];
                        currentUtxo = {
                            txid: firstInput.txid,
                            vout: firstInput.vout,
                        };
                        continue;
                    }
                    tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] =
                        currentUtxo;
                    const newInscriptionsByUtxo = deepClone(
                        tempInscriptionsByUtxo
                    );

                    setInscriptionUtxosByUtxo(newInscriptionsByUtxo);
                    setUtxosReady(true);
                    break;
                }
            }

            setInscriptionUtxosByUtxo(tempInscriptionsByUtxo);
            setUtxosReady(true);
        }
        fetchUtxosForAddress();
    }, [nostrPublicKey]);

    const content = normalizedData(homepageData?.content || []);
    return (
        <Wrapper>
            <SEO pageTitle="Deezy" />
            <Header
                nostrPublicKey={nostrPublicKey}
                address={nostrAddress}
                setNostrPublicKey={setNostrPublicKey}
            />

            <main id="main-content">
                <HeroArea data={content["hero-section"]} />

                {nostrPublicKey && (
                    <OrdinalsArea
                        utxosReady={utxosReady}
                        ownedUtxos={ownedUtxos}
                        inscriptionUtxosByUtxo={inscriptionUtxosByUtxo}
                    />
                )}
            </main>

            <Footer />
        </Wrapper>
    );
};

export default App;
