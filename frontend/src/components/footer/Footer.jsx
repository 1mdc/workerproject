import React from 'react';
import {Link} from 'react-router-dom';

function Footer() {
  return (
    <div>
      <footer className="footer__1">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 space-y-20">
              <div className="footer__logo">
                <Link to="/">
                  <img src={`img/logo.png`} alt="logo" id="logo_js_f" />
                </Link>
              </div>
              <p className="footer__text">
                Peon Fam NFT market
              </p>
              <div>
                <ul className="footer__social space-x-10 mb-40">
                  <li>
                    <a href="https://t.me/peonfamcommunity" rel="noreferrer"  target="_blank">
                      <i className="ri-telegram-line" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="copyright text-center">
            Copyright © 2021. Created by peonfam team.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
