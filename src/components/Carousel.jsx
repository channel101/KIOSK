import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Image, makeStyles, useTheme } from '@rneui/themed';

const Carousel = ({ images = [], interval = 3000, height = 200 }) => {
  const flatListRef = useRef(null);
  const { theme } = useTheme();
  const styles = useStyles(theme);

  const [carouselWidth, setCarouselWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1 || carouselWidth === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev === images.length - 1 ? 0 : prev + 1;

        flatListRef.current?.scrollToOffset({
          offset: next * carouselWidth,
          animated: true,
        });

        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [carouselWidth, images.length, interval]);

  const onMomentumScrollEnd = e => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / carouselWidth);
    setCurrentIndex(index);
  };

  if (!images.length) return null;

  return (
    <View
      style={[styles.wrapper, { height }]}
      onLayout={e => {
        const width = Math.round(e.nativeEvent.layout.width);
        setCarouselWidth(width);
      }}
    >
      {carouselWidth > 0 && (
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={carouselWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          bounces={false}
          getItemLayout={(_, index) => ({
            length: carouselWidth,
            offset: carouselWidth * index,
            index,
          })}
          onMomentumScrollEnd={onMomentumScrollEnd}
          keyExtractor={(_, i) => `img-${i}`}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.uri }}
              style={{ width: carouselWidth, height }}
              resizeMode="contain"
              PlaceholderContent={<View style={styles.imagePlaceholder} />}
            />
          )}
        />
      )}

      {images.length > 1 && (
        <View style={styles.dotContainer}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default Carousel;

const useStyles = makeStyles(theme => ({
  wrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.grey4,
  },
  dotContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.grey3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 12,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.grey5,
  },
}));
