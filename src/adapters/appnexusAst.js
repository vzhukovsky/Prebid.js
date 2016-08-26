import Adapter from 'src/adapters/adapter';
import bidfactory from 'src/bidfactory';
import bidmanager from 'src/bidmanager';

/**
 * Bidder adapter for /ut endpoint. Given the list of all ad unit tag IDs,
 * sends out a bid request. When a bid response is back, registers the bid
 * to Prebid.js. This adapter supports alias bidding.
 */
function AppnexusAstAdapter() {

  let baseAdapter = Adapter.createNew('appnexusAst');

  /* Prebid executes this function when the page asks to send out bid requests */
  baseAdapter.callBids = function(bidRequest) {
    console.time();

    let worker = new Worker('../../build/dev/worker.js');
    worker.postMessage(JSON.stringify(bidRequest));

    worker.onerror = (event) => console.error(event);
    worker.onmessage = (event) => {
      const parsed = JSON.parse(event.data);

      parsed.forEach(pair => {
        // can't serialzie functions, so use createBid here and merge in the
        // bid object from the worker
        const bid = Object.assign(
          bidfactory.createBid(1, pair.bid),
          pair.bid
        );

        bidmanager.addBidResponse(pair.placement, bid);
        console.timeEnd();
      });

    };

  };

  return {
    createNew: exports.createNew,
    callBids: baseAdapter.callBids,
    setBidderCode: baseAdapter.setBidderCode,
  };

}

exports.createNew = () => new AppnexusAstAdapter();
