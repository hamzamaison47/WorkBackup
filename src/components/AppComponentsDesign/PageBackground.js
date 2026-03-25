import React from 'react';
import {View, ScrollView} from 'react-native';
import useAppTokens from './useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
} from '../../store/utils/scaling';

const PageBackground = ({
  children,
  style,
  scrollRef,
  refreshControl,
  scrollEnabled = true,
}) => {
  const T = useAppTokens();
  return (
    <View style={{flex: 1, backgroundColor: T.pageBg}}>
      <ScrollView
        ref={scrollRef}
        style={{flex: 1}}
        contentContainerStyle={[
          {
            paddingHorizontal: conditionalScale(14, 16, 18, 18),
            paddingTop: conditionalVerticalScale(14, 16, 18, 18),
            paddingBottom: conditionalVerticalScale(32, 36, 40, 40),
          },
          style,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        scrollEnabled={scrollEnabled}>
        {children}
      </ScrollView>
    </View>
  );
};

export default PageBackground;
