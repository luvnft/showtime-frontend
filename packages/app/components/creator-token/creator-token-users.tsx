import { Platform } from "react-native";

import { Avatar } from "@showtime-xyz/universal.avatar";
import { useIsDarkMode } from "@showtime-xyz/universal.hooks";
import { GoldHexagon, ShowtimeRounded } from "@showtime-xyz/universal.icon";
import { PressableHover } from "@showtime-xyz/universal.pressable-hover";
import { useRouter } from "@showtime-xyz/universal.router";
import { Skeleton } from "@showtime-xyz/universal.skeleton";
import { colors } from "@showtime-xyz/universal.tailwind";
import { Text } from "@showtime-xyz/universal.text";
import { VerificationBadge } from "@showtime-xyz/universal.verification-badge";
import { View, ViewProps } from "@showtime-xyz/universal.view";

import {
  CreatorTokenUser,
  TopCreatorTokenUser,
} from "app/hooks/creator-token/use-creator-tokens";
import { useHeaderHeight } from "app/lib/react-navigation/elements";
import { formatAddressShort } from "app/utilities";

import { PlatformBuyButton } from "../profile/buy-and-sell-buttons";

export const CreatorTokensTitle = ({ title }: { title: string }) => {
  const headerHeight = useHeaderHeight();
  return (
    <View tw="mb-4">
      <View
        style={{
          height: Platform.select({
            ios: headerHeight + 8,
            default: 8,
          }),
        }}
      />
      <View tw="hidden flex-row justify-between bg-white pb-4 dark:bg-black md:flex">
        <Text tw="font-bold text-gray-900 dark:text-white md:text-xl">
          {title}
        </Text>
      </View>
    </View>
  );
};

export const TopCreatorTokenItemOnProfile = ({
  index,
  tw,
  item,
  showName = false,
  ...rest
}: ViewProps & {
  index?: number;
  item: CreatorTokenUser;
  showName?: boolean;
}) => {
  const router = useRouter();
  return (
    <PressableHover
      tw={["py-1.5", tw].join(" ")}
      onPress={() => router.push(`/@${item.username}`)}
      {...rest}
    >
      <View tw="flex-row items-center">
        {index != undefined ? (
          index < 3 ? (
            <View tw="mr-1 items-center justify-center">
              <View tw="absolute -top-1">
                <GoldHexagon width={18} height={18} />
              </View>
              <Text tw="text-xs font-bold text-white">{index + 1}</Text>
            </View>
          ) : (
            <View tw="mr-1 items-center justify-center">
              <Text tw="text-xs font-bold text-gray-700 dark:text-white">
                {index + 1}
              </Text>
            </View>
          )
        ) : null}
        <View tw="web:flex-1 ml-2 flex-row items-center">
          <Avatar url={item?.img_url} size={34} />
          <View tw="w-2" />
          {showName ? (
            <View tw="flex-1 justify-center">
              {item.name ? (
                <>
                  <Text
                    tw="text-sm font-semibold text-gray-600 dark:text-gray-300"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <View tw="h-1" />
                </>
              ) : null}

              <View tw="flex-row items-center">
                <Text
                  tw="text-sm font-semibold text-gray-900 dark:text-white"
                  numberOfLines={1}
                >
                  {item.username ? (
                    <>@{item.username}</>
                  ) : (
                    <>{formatAddressShort(item.wallet_address)}</>
                  )}
                </Text>
                {Boolean(item.verified) && (
                  <View tw="ml-1">
                    <VerificationBadge size={14} />
                  </View>
                )}
              </View>
            </View>
          ) : (
            <Text
              tw="flex-1 text-sm font-semibold text-gray-900 dark:text-white"
              numberOfLines={1}
            >
              @{item?.username}
            </Text>
          )}
        </View>
      </View>
    </PressableHover>
  );
};
export const TopCreatorTokenItem = ({
  index,
  tw,
  item,
  ...rest
}: ViewProps & {
  index?: number;
  item: TopCreatorTokenUser;
}) => {
  const router = useRouter();
  const isDark = useIsDarkMode();

  return (
    <PressableHover
      tw={["mb-2 py-1.5", tw].join(" ")}
      onPress={() => {
        router.push(
          item.owner_profile?.username
            ? `/@${item.owner_profile?.username}`
            : `/@${item.owner_address}`
        );
      }}
      {...rest}
    >
      <View tw="flex-row items-center">
        <View tw="min-w-[24px]">
          {index != undefined ? (
            index < 3 ? (
              <View tw="items-center justify-center">
                <View tw="absolute -top-1">
                  <GoldHexagon width={18} height={18} />
                </View>
                <Text tw="text-xs font-bold text-white">{index + 1}</Text>
              </View>
            ) : (
              <View tw="items-center justify-center">
                <Text tw="text-xs font-bold text-gray-700 dark:text-white">
                  {index + 1}
                </Text>
              </View>
            )
          ) : null}
        </View>
        <View tw="ml-1 flex-1 flex-row items-center">
          <Avatar url={item?.owner_profile?.img_url} size={34} />
          <View tw="ml-2 flex-1 justify-center">
            <View tw="flex-row items-center">
              <Text
                tw="text-sm font-semibold text-gray-900 dark:text-white"
                numberOfLines={1}
              >
                @
                {item.owner_profile?.username
                  ? item.owner_profile?.username
                  : formatAddressShort(item.owner_address)}
              </Text>
              {Boolean(item.owner_profile?.verified) && (
                <View tw="ml-1">
                  <VerificationBadge size={14} />
                </View>
              )}
            </View>
            <View tw="mt-1 flex-row items-center">
              <Text
                tw="text-xs font-semibold text-gray-900 dark:text-white"
                numberOfLines={1}
              >
                {item.nft_count}
              </Text>
              <View tw="w-1" />
              <ShowtimeRounded
                width={14}
                height={14}
                color={isDark ? colors.white : colors.gray[900]}
              />
            </View>
          </View>
        </View>
      </View>
    </PressableHover>
  );
};
export const TopCreatorTokenListItem = ({
  index,
  tw,
  item,
  isSimplified = false,
  isMdWidth,
  ...rest
}: ViewProps & {
  index?: number;
  item: TopCreatorTokenUser;
  isSimplified?: boolean;
  isMdWidth?: boolean;
}) => {
  const isDark = useIsDarkMode();
  const router = useRouter();
  return (
    <PressableHover
      tw={["flex-row py-2.5", tw].join(" ")}
      onPress={() => {
        router.push(
          item.owner_profile?.username
            ? `/@${item.owner_profile?.username}`
            : `/@${item.owner_address}`
        );
      }}
      {...rest}
    >
      <View tw="h-[34px] flex-row">
        <View tw="min-w-[26px] items-start self-center">
          {index != undefined ? (
            index < 3 ? (
              <View tw="items-center ">
                <View tw="absolute -top-1">
                  <GoldHexagon width={18} height={18} />
                </View>
                <Text tw="text-xs font-bold text-white">{index + 1}</Text>
              </View>
            ) : (
              <View tw="items-center ">
                <Text tw="text-xs font-bold text-gray-700 dark:text-white">
                  {index + 1}
                </Text>
              </View>
            )
          ) : null}
        </View>
        <Avatar url={item?.owner_profile?.img_url} size={34} />
      </View>
      <View tw="web:flex-1 ml-2 flex-row">
        <View tw="w-[168px] justify-center md:w-[240px]">
          <View tw="min-w-[180px] flex-row">
            <Text
              tw="max-w-[150px] text-sm font-semibold text-gray-900 dark:text-white"
              numberOfLines={1}
              style={{ lineHeight: 20 }}
            >
              @
              {item.owner_profile?.username
                ? item.owner_profile?.username
                : formatAddressShort(item.owner_address)}
            </Text>
            <View tw="h-1" />
            {Boolean(item.owner_profile?.verified) && (
              <View tw="ml-1">
                <VerificationBadge size={14} />
              </View>
            )}
          </View>
          {!isSimplified ? (
            <>
              <View tw="h-1.5" />
              <Text
                tw="text-xs text-gray-500 dark:text-gray-400"
                numberOfLines={2}
              >
                {item.owner_profile?.bio}
              </Text>
            </>
          ) : null}
        </View>
        <View tw="ml-4 min-w-[50px] flex-row items-center md:ml-10">
          <Text
            tw="text-sm font-semibold text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {item.nft_count}
          </Text>
          <View tw="w-1" />
          <ShowtimeRounded
            width={16}
            height={16}
            color={isDark ? colors.white : colors.gray[900]}
          />
        </View>
        <View tw="ml-auto">
          <PlatformBuyButton
            style={{ backgroundColor: "#08F6CC", height: 26 }}
            username={item.owner_profile?.username}
          />
        </View>
      </View>
    </PressableHover>
  );
};

export const TopCreatorTokenSkeleton = ({ tw, ...rest }: ViewProps) => {
  return (
    <View tw={["mb-2 py-1.5", tw].join(" ")} {...rest}>
      <View tw="flex-row items-center pl-1">
        <Skeleton width={16} height={16} show radius={8} />
        <View tw="ml-2 flex-row items-center">
          <Skeleton width={34} height={34} show radius={999} />
          <View tw="w-2" />
          <View tw="">
            <Skeleton width={80} height={13} show radius={4} />
            <View tw="h-1" />
            <Skeleton width={60} height={13} show radius={4} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const TopCreatorTokenListItemSkeleton = ({
  tw,
  ...rest
}: ViewProps & {
  isMdWidth: boolean;
}) => {
  return (
    <View tw={["py-2.5", tw].join(" ")} {...rest}>
      <View tw="flex-row items-center pl-1">
        <Skeleton width={16} height={16} show radius={8} />
        <View tw="w-2.5" />
        <Skeleton width={34} height={34} show radius={999} />
        <View tw="ml-2 w-[178px] md:w-[274px]">
          <Skeleton width={140} height={13} show radius={4} />
        </View>
        <Skeleton width={30} height={14} show radius={4} />
        <View tw="ml-auto">
          <Skeleton width={42} height={24} show radius={999} />
        </View>
      </View>
    </View>
  );
};