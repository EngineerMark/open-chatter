import { Card, CardActionArea } from "@mui/material";
import { useState } from "react";
import PageLoader from "./PageLoader";

function ImageSelect(props) {

    const [selectedImage, setSelectedImage] = useState(null);
    const [isWorking, setIsWorking] = useState(false);

    const onClick = () => {
        (async () => {
            setIsWorking(true);
            const file = await window.electron.getSelectFile();
            if (file && !file.canceled) {
                setSelectedImage(file.filePaths[0]);
                props.onSelect(file.filePaths[0]);
            }
            setIsWorking(false);
        })();
    }

    return <>
        <PageLoader open={isWorking} />
        <Card sx={{
            ...props.sx
        }}>
            <CardActionArea onClick={onClick} sx={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}>
                {/* make image fit regardless of width and height of the card, without deforming the image itself */}
                {
                    selectedImage ? <img src={`file://${selectedImage}`} alt="selected" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <>
                        {
                            props.defaultImage ? <img src={`${props.defaultImage}`} alt="default" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <></>
                        }
                    </>
                }
            </CardActionArea>
        </Card>
    </>
}

export default ImageSelect;