import { memo, useCallback, useMemo, useRef, Suspense } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from "react-native";

import { BlurView } from "expo-blur";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { BuyButton } from "app/components/buy-button";
import { CommentButton } from "app/components/feed/comment-button";
import { FeedItemTapGesture } from "app/components/feed/feed-item-tap-gesture";
import { Like } from "app/components/feed/like";
import { NFTDropdown } from "app/components/nft-dropdown";
import { MAX_HEADER_WIDTH } from "app/constants/layout";
import { LikeContextProvider } from "app/context/like-context";
import { VideoConfigContext } from "app/context/video-config-context";
import { useShareNFT } from "app/hooks/use-share-nft";
import { Blurhash } from "app/lib/blurhash";
import { useHeaderHeight } from "app/lib/react-navigation/elements";
import { useNavigation, useScrollToTop } from "app/lib/react-navigation/native";
import { DataProvider, LayoutProvider } from "app/lib/recyclerlistview";
import { useSafeAreaFrame } from "app/lib/safe-area";
import type { NFT } from "app/types";
import { getMediaUrl } from "app/utilities";

import { Collection } from "design-system/card/rows/collection";
import { Description } from "design-system/card/rows/description";
import { Creator } from "design-system/card/rows/elements/creator";
import { Owner } from "design-system/card/rows/owner";
import { Title } from "design-system/card/rows/title";
import { Social } from "design-system/card/social";
import { Divider } from "design-system/divider";
import { useIsDarkMode } from "design-system/hooks";
import { Share } from "design-system/icon";
import { Image } from "design-system/image";
import { LikedBy } from "design-system/liked-by";
import { Media } from "design-system/media";
import { Skeleton } from "design-system/skeleton";
import { tw } from "design-system/tailwind";
import { Text } from "design-system/text";
import { View } from "design-system/view";

import { useIsMobileWeb } from "../hooks/use-is-mobile-web";
import { ViewabilityTrackerRecyclerList } from "./viewability-tracker-swipe-list";

const { height: screenHeight, width: screenWidth } = Dimensions.get("screen");
const mediaMaxHeightRelativeToScreen = 1;
const NFT_DETAIL_WIDTH = 380;
const SCROLL_BAR_WIDTH = 15;

type Props = {
  data: NFT[];
  fetchMore: () => void;
  isRefreshing: boolean;
  refresh: () => void;
  initialScrollIndex?: number;
  bottomPadding?: number;
  listId?: number;
};

export const SwipeList = ({
  data,
  fetchMore,
  isRefreshing,
  refresh,
  initialScrollIndex = 0,
  bottomPadding = 0,
  listId,
}: Props) => {
  const listRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();
  useScrollToTop(listRef);
  const navigation = useNavigation();
  const { isMobileWeb } = useIsMobileWeb();
  const { height: safeAreaFrameHeight } = useSafeAreaFrame();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const itemHeight =
    Platform.OS === "web"
      ? windowHeight - headerHeight - bottomPadding
      : Platform.OS === "android"
      ? safeAreaFrameHeight - headerHeight
      : screenHeight;

  let dataProvider = useMemo(
    () =>
      new DataProvider((r1, r2) => {
        return r1.nft_id !== r2.nft_id;
      }).cloneWithRows(data),
    [data]
  );

  const _layoutProvider = useMemo(
    () =>
      new LayoutProvider(
        () => {
          return "item";
        },
        (_type, dim) => {
          dim.width = screenWidth;
          dim.height = itemHeight;
        }
      ),
    [itemHeight]
  );

  const opacity = useSharedValue(1);

  const detailStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  }, []);

  const hideHeader = useCallback(() => {
    if (Platform.OS === "ios") {
      navigation.setOptions({
        headerShown: false,
      });
      opacity.value = withTiming(0);
    }
  }, [navigation, opacity]);

  const showHeader = useCallback(() => {
    if (Platform.OS === "ios") {
      navigation.setOptions({
        headerShown: true,
      });
      opacity.value = withTiming(1);
    }
  }, [navigation, opacity]);

  const toggleHeader = useCallback(() => {
    if (opacity.value === 1) {
      hideHeader();
    } else {
      showHeader();
    }
  }, [hideHeader, showHeader, opacity]);

  const _rowRenderer = useCallback(
    (_type: any, item: any) => {
      return (
        <FeedItem
          nft={item}
          {...{
            itemHeight,
            bottomPadding,
            detailStyle,
            toggleHeader,
            hideHeader,
            showHeader,
            listId,
          }}
        />
      );
    },
    [
      itemHeight,
      bottomPadding,
      hideHeader,
      showHeader,
      toggleHeader,
      detailStyle,
      listId,
    ]
  );

  const contentWidth = useMemo(() => {
    const scorllBarWidth = isMobileWeb ? 0 : SCROLL_BAR_WIDTH;
    return windowWidth < MAX_HEADER_WIDTH
      ? windowWidth - scorllBarWidth
      : MAX_HEADER_WIDTH;
  }, [windowWidth, isMobileWeb]);

  const layoutSize = useMemo(
    () => ({
      width: contentWidth,
      height: windowHeight,
    }),
    [contentWidth, windowHeight]
  );
  // const ListFooterComponent = useCallback(() => {
  //   const colorMode = useColorScheme();
  //   return isLoadingMore ? (
  //     <View tw="w-full">
  //       <Skeleton height={100} width={screenWidth} colorMode={colorMode} />
  //     </View>
  //   ) : null;
  // }, [isLoadingMore, bottomBarHeight, screenWidth]);

  const scrollViewProps = useMemo(
    () => ({
      pagingEnabled: true,
      showsVerticalScrollIndicator: false,
      onMomentumScrollEnd: showHeader,
      refreshControl: (
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      ),
    }),
    [isRefreshing, refresh, showHeader]
  );

  const videoConfig = useMemo(
    () => ({
      isMuted: true,
      useNativeControls: false,
      previewOnly: false,
    }),
    []
  );

  const extendedState = useMemo(() => ({ bottomPadding }), [bottomPadding]);

  return (
    <VideoConfigContext.Provider value={videoConfig}>
      <ViewabilityTrackerRecyclerList
        layoutProvider={_layoutProvider}
        dataProvider={dataProvider}
        rowRenderer={_rowRenderer}
        disableRecycling={Platform.OS === "android"}
        ref={listRef}
        initialRenderIndex={initialScrollIndex}
        style={tw.style("flex-1 dark:bg-gray-900 bg-gray-100")}
        renderAheadOffset={itemHeight}
        onEndReached={fetchMore}
        onEndReachedThreshold={itemHeight}
        scrollViewProps={scrollViewProps}
        extendedState={extendedState}
        layoutSize={layoutSize}
      />
    </VideoConfigContext.Provider>
  );
};

export const FeedItem = memo(
  ({
    nft,
    bottomPadding = 0,
    itemHeight,
    hideHeader,
    showHeader,
    toggleHeader,
    detailStyle,
    listId,
  }: {
    nft: NFT;
    detailStyle: any;
    showHeader: any;
    hideHeader: any;
    toggleHeader: any;
    bottomPadding: number;
    itemHeight: number;
    listId?: number;
  }) => {
    console.log("list id", listId);
    const { width: windowWidth } = useWindowDimensions();

    const feedItemStyle = {
      height: itemHeight,
      width: windowWidth,
    };

    let mediaHeight =
      windowWidth /
      (isNaN(Number(nft.token_aspect_ratio))
        ? 1
        : Number(nft.token_aspect_ratio));

    const mediaContainerHeight = Math.min(
      mediaHeight,
      feedItemStyle.height * mediaMaxHeightRelativeToScreen
    );

    mediaHeight = Math.min(mediaHeight, mediaContainerHeight);

    const isDark = useIsDarkMode();
    const tint = isDark ? "dark" : "light";

    const mediaWidth = useMemo(() => {
      if (windowWidth >= MAX_HEADER_WIDTH) {
        return MAX_HEADER_WIDTH - NFT_DETAIL_WIDTH;
      }

      return windowWidth - NFT_DETAIL_WIDTH;
    }, [windowWidth]);

    if (windowWidth >= 768) {
      return (
        <LikeContextProvider nft={nft}>
          <View tw="h-full w-full flex-row">
            <View
              style={[
                tw.style(
                  "flex-1 items-center justify-center bg-gray-100 dark:bg-black"
                ),
                {
                  width: 100,
                },
              ]}
            >
              <Media
                item={nft}
                numColumns={1}
                tw={`h-[${mediaHeight}px] w-[${mediaWidth}px]`}
                resizeMode="contain"
              />
            </View>
            <View
              style={[
                tw.style(
                  "bg-white dark:bg-black shadow-lg shadow-black/5 dark:shadow-white/50"
                ),
                {
                  width: NFT_DETAIL_WIDTH,
                },
              ]}
            >
              <Collection nft={nft} />
              <Divider tw="my-2" />
              <Social nft={nft} />
              <LikedBy nft={nft} />
              <View tw="mr-4 flex-row justify-between">
                <Title nft={nft} />
                <Suspense fallback={<Skeleton width={24} height={24} />}>
                  <NFTDropdown nftId={nft.nft_id} listId={listId} />
                </Suspense>
              </View>
              <Description nft={nft} />
              <View tw="px-4">
                <Creator nft={nft} />
              </View>
              {Platform.OS === "web" ? (
                <View tw="px-4 py-4">
                  <BuyButton nft={nft} />
                </View>
              ) : null}
              <Owner nft={nft} price={Platform.OS !== "ios"} />
              {/* Comments */}
            </View>
          </View>
        </LikeContextProvider>
      );
    }

    return (
      <LikeContextProvider nft={nft}>
        <View tw="w-full flex-1">
          {Platform.OS !== "web" && (
            <View>
              {nft.blurhash ? (
                <Blurhash
                  blurhash={nft.blurhash}
                  decodeWidth={16}
                  decodeHeight={16}
                  decodeAsync={true}
                  style={tw.style("w-full h-full")}
                />
              ) : (
                <Image
                  tw="h-full w-full"
                  source={{
                    uri: getMediaUrl({ nft, stillPreview: true }),
                  }}
                />
              )}
            </View>
          )}

          <FeedItemTapGesture
            toggleHeader={toggleHeader}
            showHeader={showHeader}
          >
            <View
              tw={`absolute h-[${
                itemHeight - bottomPadding - 50
              }px] justify-center`}
            >
              <Media
                item={nft}
                numColumns={1}
                tw={
                  Platform.OS === "web"
                    ? ""
                    : `h-[${mediaHeight}px] w-[${windowWidth}px]`
                }
                resizeMode="contain"
                onPinchStart={hideHeader}
                onPinchEnd={showHeader}
              />
            </View>
          </FeedItemTapGesture>

          <Reanimated.View
            style={[
              tw.style("z-1 absolute bottom-0 right-0 left-0"),
              detailStyle,
            ]}
          >
            <BlurView
              tint={tint}
              intensity={100}
              style={tw.style(
                "bg-white bg-opacity-20 dark:bg-black dark:bg-opacity-20"
              )}
            >
              <NFTDetails {...{ nft, listId }} />
              <View
                tw={`${
                  bottomPadding && bottomPadding !== 0
                    ? `h-[${bottomPadding - 1}px]`
                    : "h-0"
                }`}
              />
            </BlurView>
          </Reanimated.View>
        </View>
      </LikeContextProvider>
    );
  }
);
FeedItem.displayName = "FeedItem";

const NFTDetails = ({ nft, listId }: { nft: NFT; listId?: number }) => {
  const shareNFT = useShareNFT();

  return (
    <View>
      <View tw="h-4" />

      <View tw="px-4">
        <Creator nft={nft} shouldShowCreatorIndicator={false} />
      </View>

      <View tw="h-4" />

      <View tw="px-4">
        <Text
          tw="font-space-bold text-2xl dark:text-white"
          numberOfLines={3}
          style={{ fontSize: 17, lineHeight: 22 }}
        >
          {nft.token_name}
        </Text>

        <View tw="h-4" />

        <View tw="flex-row justify-between">
          <View tw="flex-row">
            <Like nft={nft} />
            <View tw="w-6" />
            <CommentButton nft={nft} />
          </View>

          <View tw="flex-row">
            {Platform.OS !== "ios" ? (
              <>
                <Pressable onPress={() => shareNFT(nft)}>
                  <Share
                    height={22}
                    width={22}
                    // @ts-ignore
                    color={
                      tw.style("bg-gray-900 dark:bg-white").backgroundColor
                    }
                  />
                </Pressable>
                <View tw="w-8" />
              </>
            ) : null}
            <Suspense fallback={<Skeleton width={24} height={24} />}>
              <NFTDropdown
                nftId={nft?.nft_id}
                shouldEnableSharing={false}
                listId={listId}
              />
            </Suspense>
          </View>
        </View>
      </View>

      <View tw="h-4" />
    </View>
  );
};
