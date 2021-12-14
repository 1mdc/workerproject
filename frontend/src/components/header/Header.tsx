import React from 'react';
import { useState } from 'react';
import {Link} from 'react-router-dom';
import MobileMenu from './Menu/MobileMenu';
import MegaMenu from './Menu/MegaMenu';
import {shortAddress} from "../../utils";
import Popup from "reactjs-popup";
const PagesMenu = [
  {
    title: 'Marketplace',
    link: '/',
  },
];

export default function Header(props: { userAddress: string | null, onLogout: () => void,
  onLogin: () => void, balance: number, tokenBalance: number }) {
  const [isActive, setActive] = useState(false);
  const toggleClass = () => {
    setActive(!isActive);
  };

  return (
    <div>

      <header className="header__1">
        <div className="container">
          <div className="wrapper js-header-wrapper">
            <div className="left-logo-menu">
              <div className="header__logo">
                <Link to="/">
                  <img
                      className="header__logo"
                      id="logo_js"
                      src="img/logos/Logo.svg"
                      alt="logo"
                  />
                </Link>
              </div>
              {/* ==================  */}
              <div className="header__menu">
                <ul className="d-flex space-x-20">
                  {PagesMenu.map((val, i) => (
                      <li key={i}>
                        <Link className="color_black" to={val.link}>
                          {val.title}
                        </Link>
                      </li>
                  ))}
                </ul>
              </div>
              {/* ================= */}
            </div>
            <div className="wallet-menu">
              <div className="wallet-balance-item">
                {props.balance} BNB
              </div>
              <div className="wallet-balance-item">
                {props.tokenBalance} pGOLD
              </div>
              <div className="header__btns">
                {props.userAddress ? <Popup
                    className="custom"
                    trigger={
                      <button onClick={props.onLogout} className="btn btn-grad btn-sm">
                        <i className="ri-wallet-3-line" />
                        {shortAddress(props.userAddress)}
                      </button>
                    }
                    position="bottom center">
                  <div>
                    <div
                        className="popup"
                        id="popup_bid"
                        tabIndex={-1}
                        role="dialog"
                        aria-hidden="true">
                      <div>
                        <div className="space-y-20">
                          <h3>Wallet</h3>
                          <p>
                            You are connecting with wallet <b>{props.userAddress}</b>
                          </p>
                          <p>
                            Do you want to logout?
                          </p>
                          <div className="hr" />
                          <button onClick={props.onLogout}
                                  className="btn btn-primary
                                                      w-full"
                                  aria-label="Close">
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup> : <button onClick={props.onLogin} className="btn btn-grad btn-sm">
                  <i className="ri-wallet-3-line" />
                  Connect wallet
                </button>}
              </div>
            </div>
            <div className="header__burger js-header-burger" onClick={toggleClass}/>
            <div className={` header__mobile js-header-mobile  ${isActive ? 'visible': null} `}>
            <MobileMenu />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
