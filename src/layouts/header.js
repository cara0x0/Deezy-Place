/* eslint no-extra-boolean-cast: "off" */

import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import Logo from "@components/logo";
import MainMenu from "@components/menu/main-menu";
import MobileMenu from "@components/menu/mobile-menu";
import UserDropdown from "@components/user-dropdown";
import { useOffcanvas, useSticky } from "@hooks";
import Button from "@ui/button";
import BurgerButton from "@ui/burger-button";
import WalletContext from "@context/wallet-context";
import headerData from "../data/general/header.json";
import menuData from "../data/general/menu.json";

const Header = ({ className, onConnectHandler, onDisconnectHandler }) => {
    const sticky = useSticky();
    const { offcanvas, offcanvasHandler } = useOffcanvas();

    const { nostrPublicKey, nostrAddress } = useContext(WalletContext);

    return (
        <>
            <header
                className={clsx(
                    "rn-header haeder-default black-logo-version header--fixed header--sticky",
                    sticky && "sticky",
                    className
                )}
            >
                <div className="container">
                    <div className="header-inner">
                        <div className="header-left">
                            <Logo logo={headerData.logo} />
                            <div className="mainmenu-wrapper">
                                <nav
                                    id="sideNav"
                                    className="mainmenu-nav d-none d-xl-block"
                                >
                                    <MainMenu menu={[]} />
                                </nav>
                            </div>
                        </div>
                        <div className="header-right">
                            {!Boolean(nostrPublicKey) && (
                                <div className="setting-option header-btn">
                                    <div className="icon-box">
                                        <Button
                                            color="primary-alta"
                                            className="connectBtn"
                                            size="small"
                                            onClick={onConnectHandler}
                                        >
                                            Connect Wallet
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {Boolean(nostrPublicKey) &&
                                Boolean(nostrAddress) && (
                                    <div className="setting-option rn-icon-list user-account">
                                        <UserDropdown
                                            onDisconnect={onDisconnectHandler}
                                            pubKey={nostrPublicKey}
                                            receiveAddress={nostrAddress}
                                        />
                                    </div>
                                )}
                            <div className="setting-option mobile-menu-bar d-block d-xl-none">
                                <div className="hamberger">
                                    <BurgerButton onClick={offcanvasHandler} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <MobileMenu
                isOpen={offcanvas}
                onClick={offcanvasHandler}
                menu={menuData}
                logo={headerData.logo}
            />
        </>
    );
};

Header.propTypes = {
    className: PropTypes.string,
    setNostrPublicKey: PropTypes.func,
};

export default Header;
