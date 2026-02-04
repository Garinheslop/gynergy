//components
import SelectBtn from "@modules/common/components/buttons/Select";
import InputWithIcon from "@modules/common/components/InputWithIcon";
//resources
import { inputPlaceholders } from "@resources/labels";

const FilterHeader = ({ searchedInput, searchHandler, loading, sortObj }) => {
  return (
    <header
      className={`border-tertiary xmd:h-20 xmd:flex-row flex w-full flex-col items-center justify-between gap-4 border-b py-3`}
    >
      <section className="flex h-12 w-full justify-end gap-3">
        {sortObj && (
          <SelectBtn
            selectedOptionName={sortObj.secondarySortName}
            setSelectedOptionName={sortObj.setSecondarySortName}
            setSelectedOptionValue={sortObj.setSecondarySortValue}
            options={sortObj.secondarySortOptions}
            disabled={loading}
          />
        )}
        <InputWithIcon
          inputChangeHandler={searchHandler}
          inputPlaceHolder={inputPlaceholders.searchHere}
          searchedText={searchedInput}
        />
      </section>
    </header>
  );
};

export default FilterHeader;
