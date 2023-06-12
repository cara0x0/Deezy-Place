/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useState, useEffect, useRef, use } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import { getInscription, getNostrInscription } from "@services/nosft";
import ProductDetailsArea from "@containers/product-details";
import { useRouter } from "next/router";
import { WalletContext } from "@context/wallet-context";
import { useWalletState, useHeaderHeight } from "@hooks";
import "react-loading-skeleton/dist/skeleton.css";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import useAuction from "src/hooks/use-auction";
import useInscription from "src/hooks/use-inscription";
import useIsSpent from "src/hooks/use-is-spent";

const Inscription = () => {
    const walletState = useWalletState();
    const router = useRouter();
    const { slug } = router.query;

    const elementRef = useRef(null);
    const headerHeight = useHeaderHeight(elementRef);

    const { inscription, collection, nostrData } = useInscription(slug);
    const { auction: auctionData, setIsPooling: setIsPoolingAuction } = useAuction(inscription?.inscriptionId);
    const { isSpent: isInscriptionSpent } = useIsSpent(inscription?.output);

    const onAction = async () => {
        setIsPoolingAuction(true);
    };

    return (
        <WalletContext.Provider value={walletState}>
            <Wrapper>
                <SEO pageTitle="Inscription details" />
                <Header ref={elementRef} />
                <main
                    id="main-content"
                    style={{ paddingTop: headerHeight }}
                    className="d-flex align-items-center justify-content-center"
                >
                    {inscription && (
                        <ProductDetailsArea
                            inscription={inscription}
                            isSpent={isInscriptionSpent}
                            collection={collection}
                            nostr={nostrData}
                            auction={auctionData}
                            onAction={onAction}
                        />
                    )}

                    {!inscription && (
                        <div className="inscription-area container">
                            <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
                                <Skeleton count={20} />
                            </SkeletonTheme>
                        </div>
                    )}
                </main>

                <Footer />
            </Wrapper>
        </WalletContext.Provider>
    );
};

Inscription.propTypes = {};

export default Inscription;
