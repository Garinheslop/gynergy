type PropsWithChildren = {
  children: React.ReactNode;
};

export const combineComponents = (
  ...components: React.ComponentType<PropsWithChildren>[]
): React.ComponentType<PropsWithChildren> => {
  return components.reduce(
    (
      AccumulatedComponents: React.ComponentType<PropsWithChildren>,
      CurrentComponent: React.ComponentType<PropsWithChildren>
    ) => {
      const CombinedComponent: React.FC<PropsWithChildren> = ({ children }) => {
        return (
          <AccumulatedComponents>
            <CurrentComponent>{children}</CurrentComponent>
          </AccumulatedComponents>
        );
      };
      return CombinedComponent;
    },
    ({ children }: PropsWithChildren) => <>{children}</>
  );
};
