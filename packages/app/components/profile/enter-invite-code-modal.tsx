import { useState, useEffect, useRef } from "react";
import { LayoutChangeEvent } from "react-native";

import * as Clipboard from "expo-clipboard";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Button } from "@showtime-xyz/universal.button";
import { Text } from "@showtime-xyz/universal.text";
import { TextInput } from "@showtime-xyz/universal.text-input";
import { View } from "@showtime-xyz/universal.view";

import { toast } from "design-system/toast";

const AnimatedView = Animated.createAnimatedComponent(View);

export const EnterInviteCodeModal = () => {
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [inviteCode, setInviteCode] = useState("");
  const [caretPosition, setCaretPosition] = useState(0);
  const caretOpacity = useSharedValue(1);
  const inputRef = useRef(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    const avgCharWidth = 20; // Ein geschätzter Wert, den Sie anpassen müssen
    const totalCharWidth = avgCharWidth * 6;
    const totalSpacingWidth = width - totalCharWidth;
    const spacing = totalSpacingWidth / 5; // 5 Zwischenräume zwischen 6 Zeichen
    setLetterSpacing(spacing);
  };

  useEffect(() => {
    setCaretPosition(inviteCode.length);
  }, [inviteCode]);

  const animatedCaretStyle = useAnimatedStyle(() => {
    return {
      opacity: withRepeat(
        withSequence(
          withTiming(0, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        false
      ),
    };
  }, [caretOpacity]);

  return (
    <View tw="px-4">
      <Text tw="text-base font-bold text-gray-900 dark:text-white">
        Enter invite code to launch your creator token
      </Text>
      <View tw="flex-row items-center justify-between py-4">
        <View tw="relative mr-4 flex-1 select-none rounded-md bg-gray-200 p-4 dark:bg-gray-700">
          <TextInput
            ref={inputRef}
            onChangeText={setInviteCode}
            value={inviteCode}
            maxLength={6}
            onLayout={handleLayout}
            tw={
              "w-full select-none text-3xl font-bold uppercase text-transparent"
            }
            style={{ letterSpacing }}
            autoFocus
          />
          <View tw="pointer-events-none absolute left-0 top-0 z-0 h-full w-full flex-row items-center justify-between p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Text
                key={index}
                tw={
                  "flex-1 self-center text-center text-3xl font-bold uppercase dark:text-white"
                }
              >
                {inviteCode[index] || " "}
              </Text>
            ))}
            {caretPosition < 7 && (
              <AnimatedView
                tw="absolute h-2/3 w-px bg-black dark:bg-gray-300"
                style={[
                  { left: `${Math.min(caretPosition * 16.66, 93)}%` },
                  {
                    marginLeft:
                      caretPosition < 1 ? 32 : caretPosition >= 6 ? 0 : 16,
                  },
                  animatedCaretStyle,
                ]}
              />
            )}
          </View>
        </View>
        <Text
          onPress={async () => {
            try {
              const code = await Clipboard.getStringAsync();
              if (code.length === 6) {
                setInviteCode(code);
                toast.success("Pasted from clipboard");
              }
            } catch (e: any) {
              toast.error("No permission to paste from clipboard");
            }
          }}
          tw="text-sm font-medium text-indigo-500"
        >
          Paste
        </Text>
      </View>
      <Button
        size="regular"
        onPress={() => {}}
        disabled={inviteCode.length < 6}
      >
        Review token
      </Button>
    </View>
  );
};
