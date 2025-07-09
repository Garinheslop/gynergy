import { ReactNode } from "react";

type SkeletonWrapperProps = {
  children: ReactNode;
  renderTimes: number;
};
const SkeletonWrapper: React.FC<SkeletonWrapperProps> = ({ children, renderTimes = 1 }) => {
  return (
    <>
      {Array.from({ length: renderTimes }, (_, index) => (
        <div key={index}>{children}</div>
      ))}
    </>
  );
};
export default SkeletonWrapper;
