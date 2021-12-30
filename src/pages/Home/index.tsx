/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useRecoilCallback, useRecoilState } from 'recoil';
import {
  Center,
  Heading,
  VStack,
  Stack,
  Box,
  SkeletonCircle,
  SkeletonText,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@chakra-ui/react';
import { HomeContainer, HomeWrapper } from './styles';
import { getRepositories, pageAtom } from '../../usecases/getRepositories';
import RepositoryCard from '../../components/RepositoryCard';
import { IRepository } from '../../domain/models/repository';
import { getLocalStorage, setLocalStorage } from '../../services/localStorage';

const Home: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [repositories, setRepositories] = useState<IRepository[]>([]);
  const [starredRepositories, setStarredRepositories] = useState<IRepository[]>([]);
  const [_, setPageAtom] = useRecoilState(pageAtom);
  const [tabIndex, setTabIndex] = useState(0);

  const repositoriesCallback = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        setLoadingItems(true);
        await snapshot.getPromise<IRepository[]>(getRepositories).then((res) => {
          setRepositories((previousState) => {
            if (res[0]?.id === previousState[0]?.id) {
              setPageAtom((currVal) => currVal + 1);
              return previousState;
            }
            return previousState.concat(res);
          });
          setLoadingItems(false);
        });
      },
    []
  );

  const updateRepositories = () => {
    setLoading(true);
    setRepositories((previousState) =>
      previousState.map((itemRepo) => ({
        ...itemRepo,
        starred: starredRepositories.some((repo) => repo.id === itemRepo.id)
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    repositoriesCallback().then(() => {
      setLoading(false);
    });
    const localStorageRepositories = getLocalStorage('repositories');
    if (!localStorageRepositories) {
      setLocalStorage('repositories', []);
    } else {
      setStarredRepositories(
        (localStorageRepositories as IRepository[]).sort((a, b) => b.stars - a.stars)
      );
    }
  }, [tabIndex]);

  const handleStarRepo = (item: IRepository) => {
    const localStorageRepositories = getLocalStorage('repositories');
    const newRepositories = (localStorageRepositories as IRepository[])
      .concat(item)
      .sort((a, b) => b.stars - a.stars);
    setLocalStorage('repositories', newRepositories);
    setStarredRepositories((previousState) =>
      previousState.concat(item).sort((a, b) => b.stars - a.stars)
    );
    updateRepositories();
  };

  const handleUnstarRepo = (item: IRepository) => {
    const localStorageRepositories = getLocalStorage('repositories');
    const newRepositories = (localStorageRepositories as IRepository[])
      .filter((repo) => repo.id !== item.id)
      .sort((a, b) => b.stars - a.stars);
    setLocalStorage('repositories', newRepositories);
    setStarredRepositories((previousState) =>
      previousState.filter((repo) => repo.id !== item.id).sort((a, b) => b.stars - a.stars)
    );
    updateRepositories();
  };

  return (
    <HomeContainer>
      <HomeWrapper>
        <Center>
          <VStack direction="column">
            <Stack>
              <Heading>The most starred repositories</Heading>
            </Stack>
            <Tabs
              onChange={(index) => {
                setPageAtom((currVal) => {
                  if (currVal > 1) return currVal - 1;
                  return currVal;
                });

                setTabIndex(index);
              }}
              variant="enclosed">
              <TabList>
                <Tab>All({repositories.length})</Tab>
                <Tab>Starred({starredRepositories.length})</Tab>
              </TabList>
              <Stack
                onScroll={(e) => {
                  if (tabIndex === 0) {
                    if (
                      e.currentTarget.scrollTop + e.currentTarget.offsetHeight + 1 >=
                      e.currentTarget.scrollHeight
                    ) {
                      setPageAtom((currVal) => currVal + 1);
                      repositoriesCallback();
                      return;
                    }
                    if (e.currentTarget.scrollTop === 0) {
                      setPageAtom(0);
                      setRepositories(repositories.slice(0, 5));
                    }
                  }
                }}
                style={{
                  overflowY: 'scroll',
                  height: '70vh'
                }}
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px'
                  },
                  '&::-webkit-scrollbar-track': {
                    width: '10px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'green',
                    borderRadius: '24px'
                  }
                }}
                spacing={2}>
                <TabPanels>
                  <TabPanel>
                    {!loading ? (
                      <>
                        {(repositories as unknown as IRepository[]).map((item: IRepository) => (
                          <RepositoryCard
                            callbackHandleUnstarRepo={handleUnstarRepo}
                            callbackHandleStarRepo={handleStarRepo}
                            key={item.id}
                            item={item}
                            tabIndex={tabIndex}
                          />
                        ))}
                        {loadingItems && <Button>loading more items</Button>}
                      </>
                    ) : (
                      <Box padding="6" boxShadow="lg" bg="white">
                        <SkeletonCircle size="10" />
                        <SkeletonText mt="4" noOfLines={4} spacing="4" />
                      </Box>
                    )}
                  </TabPanel>
                  <TabPanel>
                    {!loading ? (
                      <>
                        {(starredRepositories as unknown as IRepository[]).map(
                          (item: IRepository) => (
                            <RepositoryCard
                              callbackHandleUnstarRepo={handleUnstarRepo}
                              callbackHandleStarRepo={handleStarRepo}
                              key={item.id}
                              item={item}
                              tabIndex={tabIndex}
                            />
                          )
                        )}
                        {starredRepositories.length === 0 && <Button width="22vw">empty</Button>}
                      </>
                    ) : (
                      <Box padding="6" boxShadow="lg" bg="white">
                        <SkeletonCircle size="10" />
                        <SkeletonText mt="4" noOfLines={4} spacing="4" />
                      </Box>
                    )}
                  </TabPanel>
                </TabPanels>
              </Stack>
            </Tabs>
          </VStack>
        </Center>
      </HomeWrapper>
    </HomeContainer>
  );
};

export default Home;
