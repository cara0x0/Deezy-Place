/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
import clsx from "clsx";
import { TiArrowSortedDown, TiArrowSortedUp } from "react-icons/ti";
import { Form } from "react-bootstrap";
import { HIDE_TEXT_UTXO_OPTION } from "@lib/constants.config";

const OrdinalFilter = ({
  searchQuery,
  setSearchQuery,
  setActiveSort,
  setSortAsc,
  activeSort,
  sortAsc,
  utxosType,
  setUtxosType,
  utxosOptions,
  showOnlyOrdinals,
  setShowOnlyOrdinals,
}) => {
  const onSearchByKeyWord = (event) => {
    setSearchQuery(event.target.value);
  };

  const onFilterByValue = () => {
    if (activeSort === "value") {
      setSortAsc(!sortAsc);
      return;
    }
    setActiveSort("value");
  };

  const onShowOnlyOrdinals = (event) => {
    setShowOnlyOrdinals(event.target.checked);
  };

  const onFilterByNum = () => {
    if (activeSort === "num") {
      setSortAsc(!sortAsc);
      return;
    }
    setActiveSort("num");
  };

  const onFilterByDate = () => {
    if (activeSort === "date") {
      setSortAsc(!sortAsc);
      return;
    }
    setActiveSort("date");
  };

  const onUtxosType = (event) => {
    setUtxosType(!event.target.checked ? "" : HIDE_TEXT_UTXO_OPTION);
  };

  const hideTxt = utxosType === HIDE_TEXT_UTXO_OPTION;

  return (
    <div className="row">
      <div className="col-6 col-md-5">
        <input
          placeholder="Search"
          value={searchQuery}
          onChange={onSearchByKeyWord}
        />
      </div>
      <div className="col">
        <button
          type="button"
          className={clsx(
            "sort-button d-flex flex-row justify-content-center",
            activeSort === "date" && "active",
          )}
          onClick={onFilterByDate}
        >
          <div>Date</div>
          {activeSort === "date" && (
            <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>
          )}
        </button>
      </div>
      <div className="col">
        <button
          type="button"
          className={clsx(
            "sort-button d-flex flex-row justify-content-center",
            activeSort === "value" && "active",
          )}
          onClick={onFilterByValue}
        >
          <div>Value</div>
          {activeSort === "value" && (
            <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>
          )}
        </button>
      </div>
      <div className="col">
        <button
          type="button"
          className={clsx(
            "sort-button d-flex flex-row justify-content-center",
            activeSort === "num" && "active",
          )}
          onClick={onFilterByNum}
        >
          <div>#</div>
          {activeSort === "num" && (
            <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>
          )}
        </button>
      </div>
      {/* Please keep for later complex filters */}
      {/* {utxosOptions && (
                <div className="col">
                    <Form.Select aria-label="Type" onChange={onUtxosType} value={utxosType}>
                        {utxosOptions.map((type) => (
                            <option value={type}>{type}</option>
                        ))}
                    </Form.Select>
                </div>
            )} */}
      {utxosOptions && (
        <div className="col">
          <Form.Check
            type="checkbox"
            id="hide-text-inscriptions"
            label="Hide .txt"
            onChange={onUtxosType}
            checked={hideTxt}
          />
        </div>
      )}
      {setShowOnlyOrdinals && (
        <div className="col">
          <Form.Check
            type="checkbox"
            id="only-inscriptions"
            label="Show only ordinals"
            onChange={onShowOnlyOrdinals}
            checked={showOnlyOrdinals}
          />
        </div>
      )}
    </div>
  );
};

OrdinalFilter.propTypes = {
  utxosOptions: PropTypes.array,
  ownedUtxos: PropTypes.array,
  setFilteredOwnedUtxos: PropTypes.func,
  setActiveSort: PropTypes.func,
  setSortAsc: PropTypes.func,
  activeSort: PropTypes.string,
  sortAsc: PropTypes.bool,
  utxosType: PropTypes.string,
  setUtxosType: PropTypes.func,
  showOnlyOrdinals: PropTypes.bool,
};

OrdinalFilter.defaultProps = {};

export default OrdinalFilter;
