import RNFS, { DownloadFileOptions } from 'react-native-fs';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ImageSourcePropType,
  ImageResizeMode,
  StyleProp,
  ImageStyle,
  ViewStyle,
  ImageURISource,
} from 'react-native';

export interface Props {
  source: ImageURISource;
  resizeMode: ImageResizeMode | undefined;
  defaultImage: ImageSourcePropType;
  defaultImageResizeMode: ImageResizeMode | undefined;
  defaultImageStyle: StyleProp<ImageStyle>;
  imageStyle: StyleProp<ImageStyle>;
  errorImage: ImageSourcePropType;
  errorImageStyle: StyleProp<ImageStyle>;
  style: StyleProp<ImageStyle>;
  containerStyle: StyleProp<ViewStyle>;
}

const SmartImage: React.FC<Props> = ({
  source,
  resizeMode,
  defaultImageStyle,
  imageStyle,
  errorImage,
  errorImageStyle,
  style,
  containerStyle,
  defaultImage,
}) => {
  const [failToLoad, setFailedToLoad] = useState(false);
  const [localSource, setLocalSource] = useState<ImageURISource>({ uri: '' });
  const [loadSuccess, setLoadSuccess] = useState(false);

  useEffect(() => {
    checkForImageLocalPathNew();
  }, []);

  const checkForImageLocalPathNew = async () => {
    if (source?.uri) {
      setLoadSuccess(false);
      let dirPath = 'file://' + RNFS.CachesDirectoryPath + '/images/';

      RNFS.exists(dirPath)
        .then((res: boolean) => {
          if (res) {
            performImageStoreAction();
          } else {
            RNFS.mkdir(dirPath)
              .then(() => {
                performImageStoreAction();
              })
              .catch(() => {
                loadFailureOfImage();
              });
          }
        })
        .catch(() => {
          loadFailureOfImage();
        });
    } else {
      loadFailureOfImage();
    }
  };

  const loadFailureOfImage = () => {
    setFailedToLoad(true);
    setLoadSuccess(false);
  };

  const loadSuccessOfImage = (imageCachePath: string) => {
    setLocalSource({ uri: imageCachePath });
    setFailedToLoad(false);
    setLoadSuccess(true);
  };

  const performImageStoreAction = () => {
    var filename = source?.uri?.replace(/^.*[\\\/]/, '');
    let imageCachePath =
      'file://' + RNFS.CachesDirectoryPath + '/images/' + filename;

    const options: DownloadFileOptions = {
      fromUrl: source?.uri ? String(source.uri) : '',
      toFile: imageCachePath,
    };

    RNFS.exists(imageCachePath)
      .then((isImageExist: boolean) => {
        if (isImageExist) {
          loadSuccessOfImage(imageCachePath);
        } else {
          RNFS.downloadFile(options)
            .promise.then(() => {
              loadSuccessOfImage(imageCachePath);
            })
            .catch(() => {
              loadFailureOfImage();
            });
        }
      })
      .catch(() => {
        loadFailureOfImage();
      });
  };

  const renderImageView = () => {
    if (failToLoad) {
      return (
        <Image
          source={errorImage}
          resizeMode={resizeMode || 'cover'}
          style={style ? style : [styles.errorImageStyle, errorImageStyle]}
        />
      );
    } else if (loadSuccess) {
      return (
        <Image
          source={localSource}
          resizeMode={resizeMode || 'cover'}
          onError={() => {
            loadFailureOfImage();
          }}
          style={style ? style : [styles.imageStyle, imageStyle]}
        />
      );
    } else {
      return (
        <Image
          source={defaultImage}
          resizeMode={resizeMode || 'cover'}
          style={style ? style : [styles.defaultImageStyle, defaultImageStyle]}
        />
      );
    }
  };

  return <View style={containerStyle}>{renderImageView()}</View>;
};

export default SmartImage;

let styles = StyleSheet.create({
  imageStyle: {
    height: 150,
    width: 150,
  },
  defaultImageStyle: {
    height: 150,
    width: 150,
  },
  errorImageStyle: {
    height: 150,
    width: 150,
  },
});
