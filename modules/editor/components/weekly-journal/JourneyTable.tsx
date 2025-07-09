import { cn } from "@lib/utils/style";
import TextArea from "@modules/common/components/TextArea";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { JourneyTableData } from "@resources/types/journal";
import { useEffect, useState } from "react";

type FieldKey =
  // Group 1: Current / Vision
  | "romanticRelationshipSituation"
  | "romanticRelationshipVision"
  | "familyFriendSituation"
  | "familyFriendVision"
  | "qualityOfLifeSituation"
  | "qualityOfLifeVision"
  | "spiritualSituation"
  | "spiritualVision"
  // Group 1: Why / Strategy
  | "romanticRelationshipWhy"
  | "romanticRelationshipStrategy"
  | "familyFriendWhy"
  | "familyFriendStrategy"
  | "qualityOfLifeWhy"
  | "qualityOfLifeStrategy"
  | "spiritualWhy"
  | "spiritualStrategy"
  // Group 2: Current / Vision
  | "healthFitnessSituation"
  | "healthFitnessVision"
  | "personalDevSituation"
  | "personalDevVision"
  | "careerBusinessSituation"
  | "careerBusinessVision"
  | "financialSituation"
  | "financialVision"
  // Group 2: Why / Strategy
  | "healthFitnessWhy"
  | "healthFitnessStrategy"
  | "personalDevWhy"
  | "personalDevStrategy"
  | "careerBusinessWhy"
  | "careerBusinessStrategy"
  | "financialWhy"
  | "financialStrategy";

type JourneyValues = Record<FieldKey, string>;

const JourneyTable = ({
  journeyData,
  onTableInput,
  isStatic,
}: {
  isStatic?: boolean;
  journeyData: JourneyTableData;
  onTableInput?: (value: JourneyTableData) => void;
}) => {
  const allKeys = (
    [
      // Group 1 rows
      "romanticRelationship",
      "familyFriend",
      "qualityOfLife",
      "spiritual",
      // Group 2 rows
      "healthFitness",
      "personalDev",
      "careerBusiness",
      "financial",
    ] as const
  ).flatMap((key) =>
    // each rowKey gets these four suffixes
    ["Situation", "Vision", "Why", "Strategy"].map((suffix) => `${key}${suffix}` as FieldKey)
  );

  //  Reduce that array into an object with empty-string defaults
  const [values, setValues] = useState<JourneyValues>(
    allKeys.reduce((acc, k) => {
      acc[k] = "";
      return acc;
    }, {} as JourneyValues)
  );

  useEffect(() => {
    if (journeyData) {
      setValues(journeyData);
    }
  }, [journeyData]);

  // Keep `isComplete` in sync whenever `values` changes
  useEffect(() => {
    // const complete = Object.values(values).every((v) => v.trim() !== "");
    if (onTableInput) {
      onTableInput(values);
    }
  }, [values]);

  const onTableInputHandler = (field: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  // descriptor for each of the four tables
  const tableConfigs = [
    {
      title: ["", "My Current Situation", "My Vision"],
      rows: [
        {
          key: "romanticRelationship",
          label: "Romantic Relationship",
          suffixes: ["Situation", "Vision"],
        },
        { key: "familyFriend", label: "Family and Friends", suffixes: ["Situation", "Vision"] },
        { key: "qualityOfLife", label: "Quality of Life", suffixes: ["Situation", "Vision"] },
        { key: "spiritual", label: "Spiritual", suffixes: ["Situation", "Vision"] },
      ],
      isSecondary: false,
    },
    {
      title: ["", "Why I Want It", "My Strategy"],
      rows: [
        {
          key: "romanticRelationship",
          label: "Romantic Relationship",
          suffixes: ["Why", "Strategy"],
        },
        { key: "familyFriend", label: "Family and Friends", suffixes: ["Why", "Strategy"] },
        { key: "qualityOfLife", label: "Quality of Life", suffixes: ["Why", "Strategy"] },
        { key: "spiritual", label: "Spiritual", suffixes: ["Why", "Strategy"] },
      ],
      isSecondary: true,
    },
    {
      title: ["", "My Current Situation", "My Vision"],
      rows: [
        { key: "healthFitness", label: "Health and Fitness", suffixes: ["Situation", "Vision"] },
        { key: "personalDev", label: "Personal Development", suffixes: ["Situation", "Vision"] },
        { key: "careerBusiness", label: "Career and Business", suffixes: ["Situation", "Vision"] },
        { key: "financial", label: "Financial", suffixes: ["Situation", "Vision"] },
      ],
      isSecondary: false,
    },
    {
      title: ["", "Why I Want It", "My Strategy"],
      rows: [
        { key: "healthFitness", label: "Health and Fitness", suffixes: ["Why", "Strategy"] },
        { key: "personalDev", label: "Personal Development", suffixes: ["Why", "Strategy"] },
        { key: "careerBusiness", label: "Career and Business", suffixes: ["Why", "Strategy"] },
        { key: "financial", label: "Financial", suffixes: ["Why", "Strategy"] },
      ],
      isSecondary: true,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      {tableConfigs.map((tbl, tblIndex) => (
        <div key={tblIndex} className="border border-border-light rounded w-full overflow-x-auto">
          {/* Headers */}
          <div className="grid grid-cols-[233px_1fr_1fr] min-w-[700px]">
            {tbl.title.map((txt, i) => (
              <div
                key={i}
                className={cn(
                  "border-r last:border-r-0 border-b border-border-light min-h-[57px] flex items-center justify-center",
                  {
                    "bg-action-50": !tbl.isSecondary,
                    "bg-gray-100": tbl.isSecondary,
                    "bg-action-100": !tbl.isSecondary && !txt,
                    "bg-gray-200": tbl.isSecondary && !txt,
                  }
                )}
              >
                <Paragraph content={txt} sx="font-semibold" />
              </div>
            ))}
          </div>

          {/* Body */}
          {tbl.rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-[233px_1fr_1fr] border-b last:border-0 border-border-light min-w-[700px]"
            >
              {/* Row header */}
              <div
                className={cn(
                  "border-r px-[15px] border-border-light min-h-[57px] flex items-center",
                  {
                    "bg-action-50": !tbl.isSecondary,
                    "bg-gray-100": tbl.isSecondary,
                  }
                )}
              >
                <Paragraph content={row.label} sx="font-semibold" />
              </div>

              {/* Two input cells */}
              {row.suffixes.map((suffix, colIdx) => {
                const fieldKey = `${row.key}${suffix}` as FieldKey;
                return (
                  <div
                    key={colIdx}
                    className={cn("min-h-[57px] flex items-center justify-center", {
                      "border-r border-border-light": colIdx === 0,
                      "justify-start px-[15px]": isStatic,
                    })}
                  >
                    {isStatic ? (
                      <Paragraph content={values[fieldKey]} sx="text-start" />
                    ) : (
                      <TextArea
                        value={values[fieldKey]}
                        onChange={(e) => onTableInputHandler(fieldKey, e.target.value)}
                        rows={1}
                        textareaSx="py-[14px] border-0 rounded-0 focus:shadow-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default JourneyTable;
