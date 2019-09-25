import React from 'react';
import * as FaceDetector from 'expo-face-detector';
import { View, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import {Camera} from 'expo-camera';
import * as Permissions from 'expo-permissions';
import styled from 'styled-components';
import {MaterialIcons} from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

const {width, height} = Dimensions.get('window');
const ALBUM_NAME = "Smiley Cam";

const CenterView = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: cornflowerblue;
`;

const Text = styled.Text`
    color: white;
    font-size: 22px;
`;


const IconBar = styled.View`
    margin-top: 50px;
`;

export default class App extends React.Component {
   constructor(props) {
       super(props);
       this.state = {
           hasPermission: null,
           cameraType: Camera.Constants.Type.front,
           smileDetected: false,
       };
       this.cameraRef = React.createRef();
   }
componentDidMount = async () => {
    const {status} = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
        this.setState({hasPermission: true});
    } else {
        this.setState({hasPermission: false});
    }
};
render() {
    const {hasPermission, cameraType, smileDetected} = this.state;
    if (hasPermission === true) {
        return (
            <CenterView>
                <Text>Smiley Cam :)</Text>
                <Camera
                    style={{
                        width: width - 40,
                        height: height / 1.5,
                        borderRadius: 10,
                        overflow: 'hidden'
                    }}
                    type={cameraType}
                    onFacesDetected={smileDetected ? null : this.onFacesDetected}
                    faceDetectorSettings={{
                        detectLandMarks: FaceDetector.Constants.Classifications.all,
                        runClassifications: FaceDetector.Constants.Classifications.all
                    }
                    }
                    ref={this.cameraRef}
                />
                <IconBar>
                    <TouchableOpacity onPress={this.switchCameraType}>
                        <MaterialIcons
                            name={
                                cameraType === Camera.Constants.Type.front
                                    ? "camera-rear" : "camera-front"
                            }
                            color={'white'}
                            size={50}
                        />
                    </TouchableOpacity>
                </IconBar>
                <Text>
                    {smileDetected ? null : "사진 저장완료"}
                </Text>
            </CenterView>
        )
    } else if (hasPermission === false) {
        return (
            <CenterView>
                <Text>
                    You need a Permission.
                </Text>
            </CenterView>
        )
    } else {
        return (
            <CenterView><ActivityIndicator/></CenterView>
        )
    }
};

    switchCameraType = () => {
        const {cameraType} = this.state;
        if (cameraType === Camera.Constants.Type.front) {
            this.setState({
                cameraType: Camera.Constants.Type.back
            })
        } else {
            this.setState({
                cameraType: Camera.Constants.Type.front
            })
        }
    };

    onFacesDetected = async({faces}) => {
        const face = faces[0];
        if(face) {
            if(face.smilingProbability > 0.7){
                this.setState({
                    smileDetected: true
                });
                await this.takePhoto();
            }
        }

    };

    takePhoto = async() => {
        try {
            if(this.cameraRef.current){
                let {uri} = await this.cameraRef.current.takePictureAsync({
                    quality:1,
                });
                if(uri){
                    this.savePhoto(uri);
                }
                //smileDetected를 false로 바꿔주면 될듯하다.
            }
        } catch(error) {
            alert(error);
            this.setState({
                smileDetected: false,
            });
            console.log(error);
        }

    };
    savePhoto = async(uri) => {
        try {
            const {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if(status === 'granted'){
                const asset = await MediaLibrary.createAssetAsync(uri);
                let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
                if(album === null){
                    album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset);
                } else {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album.id);
                }
                setTimeout(()=>{
                    this.setState({
                        smileDetected: false,
                    });
                }, 1000);
                console.log("Saved");
            } else {
                this.setState({hasPermissions: false});
            }
        } catch(error) {
            console.log(error);
        }
    }
}

