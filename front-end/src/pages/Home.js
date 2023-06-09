import "bootstrap/dist/css/bootstrap.css";
import React, { useEffect, useState } from "react";
import { ethers, utils } from "ethers";
import axios from "axios";
import { makeStyles } from "@material-ui/core";
import { useSelector } from "react-redux";
import { Card, Container, Row, Col } from "react-bootstrap";

import { IPFS_GATEWAY } from "../utils/ipfsStorage";
import MarketContract from "../artifacts/contracts/Market.json";
import StoreFactoryContract from "../artifacts/contracts/StoreFactory.json";
import AuctionContract from "../artifacts/contracts/AuctionMarket.json";
import StoreContract from "../artifacts/contracts/Store.json";
import contractsAddress from "../artifacts/deployments/map.json";
import networks from "../utils/networksMap.json";

const Marketaddress = "0xd9f76F8649104151fe46D9A49b5f3821b31891E8"; // "0xd9f76F8649104151fe46D9A49b5f3821b31891E8";
const factoryAddress = "0x2a7737EC3376d1C06612864244b26589D1c542dC"; // "0x2a7737EC3376d1C06612864244b26589D1c542dC";
const auctionContractAddress = "0x29Ea813e352dfF394156e36b5B18cd6Ac6EAfE93"; // "0x29Ea813e352dfF394156e36b5B18cd6Ac6EAfE93";
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const useStyles = makeStyles((theme) => ({
  Container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

function Home() {
  const classes = useStyles();

  const data = useSelector((state) => state.blockchain.value);

  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [tempProducts, setTempProducts] = useState([{image: "https://img.freepik.com/free-vector/flat-design-illustrated-nft-concept_23-2148958535.jpg?size=338&ext=jpg", name: "product-1", price: 200, store: 1, productId: 1},
  {image: "https://img.freepik.com/free-vector/flat-design-illustrated-nft-concept_23-2148958535.jpg?size=338&ext=jpg", name: "product-2", price: 200, store: 1, productId: 2},
  {image: "https://img.freepik.com/free-vector/flat-design-illustrated-nft-concept_23-2148958535.jpg?size=338&ext=jpg", name: "product-3", price: 200, store: 1, productId: 3},
  {image: "https://img.freepik.com/free-vector/flat-design-illustrated-nft-concept_23-2148958535.jpg?size=338&ext=jpg", name: "product-4", price: 200, store: 1, productId: 4}]);

  async function loadAuctions() {
    const signer = provider.getSigner();
    const market = new ethers.Contract(
      auctionContractAddress,
      AuctionContract.abi,
      signer
    );
    const allAuctions = await market.getAuctionsList();

    const openAuctions = allAuctions.filter((p) => p[7] === 0);

    if (openAuctions !== undefined) {
      const items = await Promise.all(
        openAuctions.map(async (auction) => {
          const metadataUrl = auction[2].replace("ipfs://", IPFS_GATEWAY);
          let itemMetaData = await axios.get(metadataUrl);

          const imgUrl = itemMetaData.data.image.replace(
            "ipfs://",
            IPFS_GATEWAY
          );

          let item = {
            auctionId: Number(auction[0]),
            name: itemMetaData.data.name,
            image: imgUrl,
            price: utils.formatUnits(auction[4].toString(), "ether"),
          };
          return item;
        })
      );
      setAuctions(items.reverse());
    }
  }

  async function loadProducts() {
    const signer = provider.getSigner();
    const market = new ethers.Contract(
      Marketaddress,
      MarketContract.abi,
      signer
    );
    const products = await market.getAllProducts();

    const inSaleProducts = products.filter((p) => p[8] === 1);

    const _marketProducts = inSaleProducts.map((p) => {
      const imgUrl = p[4].replace("ipfs://", IPFS_GATEWAY);
      let item = {
        productId: Number(p[0]),
        name: p[2],
        image: imgUrl,
        price: utils.formatUnits(p[5].toString(), "ether"),
        date: Number(p[9]),
      };
      return item;
    });

    const factory = new ethers.Contract(
      factoryAddress,
      StoreFactoryContract.abi,
      signer
    );
    const marketStores = await factory.getAllStores();

    let _allStoresProducts = [];
    await Promise.all(
      marketStores.map(async (store) => {
        const productStore = new ethers.Contract(
          store.storeAddress,
          StoreContract.abi,
          signer
        );
        const _storeProducts = await productStore.listStoreProducts();

        _storeProducts.map((p) => {
          const imgUrl = p[3].replace("ipfs://", IPFS_GATEWAY);
          let item = {
            store: store.storeAddress,
            productId: Number(p[0]),
            name: p[1],
            image: imgUrl,
            price: utils.formatUnits(p[4].toString(), "ether"),
            date: Number(p[8]),
          };
          _allStoresProducts.push(item);
        });
      })
    );

    const _allProducts = _marketProducts
      .concat(_allStoresProducts)
      .sort(function (a, b) {
        return b.date - a.date;
      });
    setProducts(_allProducts);

    if (marketStores !== undefined) {
      const allStores = await Promise.all(
        marketStores.map(async (store) => {
          const productStore = new ethers.Contract(
            store.storeAddress,
            StoreContract.abi,
            signer
          );
          const storeDetailsURL = await productStore.callStatic.storeMetaData();
          const metadataUrl = storeDetailsURL.replace("ipfs://", IPFS_GATEWAY);
          let meta = await axios.get(metadataUrl);
          const imgUrl = meta.data.image.replace("ipfs://", IPFS_GATEWAY);
          let item = {
            address: store.storeAddress,
            name: meta.data.name,
            image: imgUrl,
          };
          return item;
        })
      );
      setAllStores(allStores);
    }
  }

  // ganache network is used for testing purposes
  const currentNetwork = networks["80001"];
  // const isGoodNet = data.network === currentNetwork;
  // const isConnected = data.account !== "";
  const isConnected = true;
  const isGoodNet = true;

  useEffect(() => {
    loadProducts();
    loadAuctions();
  }, []);

  return (
    <>
      <div className={classes.Container}>
        {isConnected ? (
          isGoodNet ? (
            <>
              {[1,2].length !== 0 ? (
              // {products.length !== 0 ? (
                <Container>
                  <Row style={{ display: "flex" }}>
                    <Col className="col-md-6">
                      <h4 className="text-left p-2">Main Market</h4>
                    </Col>
                    <Col
                      className="col-md-6"
                      style={{ display: "inline", textAlign: "right" }}
                    >
                      <h4>
                        <a className="btn btn-primary" href="/main-market">
                          See All{" "}
                        </a>
                      </h4>
                    </Col>
                    <hr />
                  </Row>
                  <Row className="mt-5">
                    {tempProducts.map((product, id) => {
                    // {products.map((product, id) => {
                      return (
                        <Col style={{ marginBottom: "40px" }} md={3} key={id}>
                          <Card style={{ width: "16rem" }} key={id}>
                            <Card.Img
                              variant="top"
                              src={product.image}
                              width="0px"
                              height="180px"
                            />
                            <Card.Body>
                              <Card.Title style={{ fontSize: "14px" }}>
                                {product.name}
                              </Card.Title>
                              <Card.Text>
                                <Card.Text>{product.price} $</Card.Text>
                              </Card.Text>
                              {product.store !== undefined ? (
                                <a
                                  className="btn btn-primary"
                                  href={
                                    "/store-product/" +
                                    product.store +
                                    "/" +
                                    product.productId
                                  }
                                  role="button"
                                >
                                  See More
                                </a>
                              ) : (
                                <a
                                  className="btn btn-primary"
                                  href={"/products/" + product.productId}
                                  role="button"
                                >
                                  See More
                                </a>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Container>
              ) : null}
              {allStores.length !== 0 ? (
                <Container>
                  <Row style={{ display: "flex" }}>
                    <Col className="col-md-6">
                      <h4 className="text-left p-2">Stores</h4>
                    </Col>
                    <Col
                      className="col-md-6"
                      style={{ display: "inline", textAlign: "right" }}
                    >
                      <h4 className="text-right p-2">
                        <a className="btn btn-primary" href="/all-stores">
                          See All{" "}
                        </a>
                      </h4>
                    </Col>
                    <hr />
                  </Row>
                  <Row className="mt-5">
                    {allStores.map((store, id) => {
                      return (
                        <Col style={{ marginBottom: "40px" }} md={3} key={id}>
                          <Card style={{ width: "16rem" }} key={id}>
                            <Card.Img
                              variant="top"
                              src={store.image}
                              width="0px"
                              height="180px"
                            />
                            <Card.Body>
                              <Card.Title
                                style={{
                                  fontSize: "18px",
                                  textAlign: "center",
                                }}
                              >
                                <a
                                  style={{
                                    textDecoration: "none",
                                    color: "black",
                                  }}
                                  href={"/store/" + store.address}
                                >
                                  {store.name}
                                </a>
                              </Card.Title>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Container>
              ) : null}
              {auctions.length !== 0 ? (
                <Container>
                  <Row style={{ display: "flex" }}>
                    <Col className="col-md-6">
                      <h4 className="text-left p-2">Auction Market</h4>
                    </Col>
                    <Col
                      className="col-md-6"
                      style={{ display: "inline", textAlign: "right" }}
                    >
                      <h4 className="text-right p-2">
                        <a className="btn btn-primary" href="/auction-market">
                          See All{" "}
                        </a>
                      </h4>
                    </Col>
                    <hr />
                  </Row>

                  <Row className="mt-5">
                    {auctions.map((auction, id) => {
                      return (
                        <Col style={{ marginBottom: "40px" }} md={3} key={id}>
                          <Card style={{ width: "16rem" }} key={id}>
                            <Card.Img
                              variant="top"
                              src={auction.image}
                              width="0px"
                              height="180px"
                            />
                            <Card.Body>
                              <Card.Title style={{ fontSize: "14px" }}>
                                {auction.name}
                              </Card.Title>
                              <Card.Text>
                                <Card.Text>
                                  {parseFloat(auction.price).toFixed(3)} ETH
                                </Card.Text>
                              </Card.Text>
                              <a
                                className="btn btn-primary"
                                href={"/auctions/" + auction.auctionId}
                                role="button"
                              >
                                See More
                              </a>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Container>
              ) : null}
            </>
          ) : (
            <div className={classes.Container}>
              You are on the wrong network switch to {currentNetwork} network
            </div>
          )
        ) : null}
      </div>
    </>
  );
}

export default Home;
