import React from 'react';
import {Link} from 'react-router-dom';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import CardMarketArt from '../../../components/cards/CardMarketArt';
import CardMarketCards from '../../../components/cards/CardMarketCards';
import CardMarketplace from '../../../components/cards/CardMarketplace';
import CardMarketplaceGame from '../../../components/cards/CardMarketplaceGame';
import Collection2 from '../../../components/collection/Collection2';

function MenuCategoriesMarket() {
  return (
    <div className="w-100">
      <Tabs className=" border-b">
        <TabList className="menu_categories  bg_white py-20 px-15 w-100">
          <Tab>
            <Link className="color_brand" to="/">
              <span> Peon Marketplace</span>
            </Link>
          </Tab>
          <Tab>
            <Link to="/">
              <i className="ri-gamepad-line" />
              <span> Your Peons</span>
            </Link>
          </Tab>
          <Tab>
            <Link to="/">
              <i className="ri-brush-line" />
              <span> Your Bids</span>
            </Link>
          </Tab>
          <Tab>
            <Link to="/">
              <i className="ri-stock-line" />
              <span> Recent Minted</span>
            </Link>
          </Tab>
        </TabList>
        <TabPanel>
          <div className="container">
            <div className="section mt-100">
              <div>
                <h2 className="section__title mb-20"> All Categories</h2>
                <div>
                  <div>
                    <div className="d-flex align-items-center">
                      <CardMarketplace />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="container">
            <div className="section mt-100">
              <div className="section__head">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="section__title"> Games</h2>

                </div>
              </div>
              <CardMarketplaceGame />
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="container">
            <div className="section mt-100">
              <div className="section__head">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="section__title"> Artworks</h2>

                </div>
              </div>
              <CardMarketArt />
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="container">
            <div className="section mt-100">
              <div className="section__head">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="section__title"> Trading Cards</h2>

                </div>
              </div>
              <CardMarketCards />
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}

export default MenuCategoriesMarket;
