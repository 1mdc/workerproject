import React from 'react';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import useDocumentTitle from '../components/useDocumentTitle';
// @ts-ignore
import {HashLink} from 'react-router-hash-link';

import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import HeroQuestions from '../components/hero/HeroQuestions';
import {Link} from 'react-router-dom';

const FaqContent = [
  {
    title: 'Why not Play to earn?',
    desc: `Firstly, most of smart contract developers are not game developers. We could not create high quality games. Secondly, play to earn is a new trend in cryptocurrency industry. However, majority of games are boring to play. Most of investors only interest in owning NFT asset and sell it for higher price. When AAA game companies join the industry, most of current NFT games will die. So we don't think that is a longevity approach`,
    expand: 'notplaytoearn',
    link: 'peonproject',
  },
  {
    title: 'What is Peon NFT?',
    desc: `Peon NFT is ERC721 token. User can mint (with a cost), transfer or bid to buy from other user. All actions are on chain and no middle man.`,
    expand: 'whatispeonnft',
    link: 'peonproject',
  },
  {
    title: 'What is pBANANA token?',
    desc: `When you own a peon, it collects pBANANA over time and reward that to the owner. pBANANA is ERC20 token. This token can only be generated by Peon NFT token.`,
    expand: 'whatisbananatoken',
    link: 'peonproject',
  },
  {
    title: 'How is pBANANA distributed?',
    desc: `Each block will distribute 100 pBANANA to all peon equally. However, each peon may receive a different pBANANA depended on its mining efficiency.`,
    expand: 'pbananadistribution',
    link: 'peonproject',
  },
  {
    title: 'What is rarity for peon?',
    desc: `Yes. Peon's rarity determines mining efficiency. For example, if mining efficiency is 2.5, if each peon receive 1 pBANANA per block this peon will receive 2.5 pBANANA.`,
    expand: 'rarity',
    link: 'peonproject',
  },
  {
    title: 'Is this project fair launch and permissionless?',
    desc: `Yes, it is. The presale was implemented for calling seed investor but the team decided and disabled it right after the launch. Both NFT and pBANANA tokens are permissionless. Dev team does not permission to mint anything out of thin air. The admin permission in NFT contract is for dev to withdraw mint fee. This fee is used for future ecosystem development.`,
    expand: 'fairlaunch',
    link: 'peonproject',
  },
  {
    title: 'What is the contract addresses?',
    desc: `NFT contract was deployed at .... ERC20 token contract was deployed at .... Both contracts are non-upgradable contracts`,
    expand: 'contractaddresses',
    link: 'peonproject',
  },
  {
    title: 'What is pBANANA token used for?',
    desc: `For now, you can exchange pBANANA to other tokens from https://pancakeswap.com/. Future development to create utility for pBANANA`,
    expand: 'pbananausecase',
    link: 'peonproject',
  },
  {
    title: 'I am not technical user, so I cannot read the contract. Can you summarize it?',
    desc: `Sure. pBANANA is a typical mintable ERC20 token. The only address can mint token is NFT address. That was for minted peon to generate pBANANA. NFT contract has functionalities to allow user to mint, bid to buy from others, accept bid, cancel bid and transfer NFT to different address. preSale function to mint NFT out of thin air for calling investors but it was disabled. sale to enable a number of mintable NFT token. We use this to open the sales gradually. There are 20000 peon could be generated. Each peon has a random mining efficiency when it is minted to specify how fast pBANANA can be generated per block. There are about 100 pBANANA minted per block, so the inflation is linear.`,
    expand: 'contractexplain',
    link: 'peonproject',
  },
  {
    title: 'Is there any fee on marketplace?',
    desc: `No fee for any activity on market place`,
    expand: 'anyfee',
    link: 'marketplace',
  },
  {
    title: 'How can I change the bid price?',
    desc: `You can't. You must cancel previous bid to bid a new one`,
    expand: 'changebid',
    link: 'marketplace',
  },
  {
    title: 'I bid/cancel/accept a peon, but website does not change?',
    desc: `Please try to refresh the page. The backend may be a bit slow updating`,
    expand: 'noupdate',
    link: 'marketplace',
  },
  {
    title: 'Where is the best place to discuss this project?',
    desc: `Join out community in Telegram`,
    expand: 'community',
    link: 'community',
  },
];

export default function Faq(props: {
  userAddress: string | null,
  onLogout: () => void,
  onLogin: () => void,
  balance: number,
  tokenBalance: number,
}) {
  useDocumentTitle('Faq');
  return (
    <div>
      <Header userAddress={props.userAddress} onLogout={props.onLogout}
              onLogin={props.onLogin} balance={props.balance} tokenBalance={props.tokenBalance} />
      <HeroQuestions />
      <div>
        <div className="questions__page mt-100">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="row">
                <div className="col-lg-3 col-md-3 col-sm-4">
                  <div className="box side">
                    <div className="sidenav">
                      <ul>
                        <li className="d-flex align-items-center space-x-10">
                          <i className="ri-home-2-line" />
                          <HashLink
                            className="text__reset"
                            to="#peonproject"
                            scroll={(el:any) =>
                              el.scrollIntoView({block: 'start'})
                            }>
                            Peon Project
                          </HashLink>
                        </li>
                        <li className="d-flex align-items-center space-x-10">
                          <i className="ri-chat-1-line" />
                          <Link className="text__reset" to="#marketplace">
                            Marketplace
                          </Link>
                        </li>
                        <li className="d-flex align-items-center space-x-10">
                          <i className="ri-chat-1-line" />
                          <Link className="text__reset" to="#community">
                            Community
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-lg-9 col-md-9 col-sm-8">
                  <div className="questions__box space-y-30">
                    <Accordion
                      className="ff"
                      preExpanded={['b']}
                      allowZeroExpanded>
                      {FaqContent.map((item, i) => (
                        <AccordionItem
                          id={item.link}
                          className="accordion p-30 mb-20"
                          key={i}
                          uuid={item.expand}>
                          <AccordionItemHeading className="accordion-header p-0">
                            <AccordionItemButton>
                              <button className="accordion-button">
                                {item.title}
                              </button>
                            </AccordionItemButton>
                          </AccordionItemHeading>
                          {/* Accordion Heading */}
                          <AccordionItemPanel>
                            <p className="accordion-desc">{item.desc}</p>
                          </AccordionItemPanel>
                          {/* Accordion Body Content */}
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};