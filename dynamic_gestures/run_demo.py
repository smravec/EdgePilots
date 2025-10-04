import argparse
import time

import cv2
import numpy as np

from main_controller import MainController
from utils import targets


def run(args):
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    controller = MainController(args.detector, args.classifier)
    debug_mode = args.debug
    prev_commamnd = None
    command = ""

    while cap.isOpened():
        ret, frame = cap.read()
        frame = cv2.flip(frame, 1)
        if ret:
            start_time = time.time()
            bboxes, ids, labels = controller(frame)
            if debug_mode:
                if bboxes is not None:
                    bboxes = bboxes.astype(np.int32)
                    for i in range(bboxes.shape[0]):
                        box = bboxes[i, :]
                        gesture = targets[labels[i]] if labels[i] is not None else "None"

                    
                        if gesture == "fist":
                            command = "STOP"
                        elif gesture == "three_gun":
                            command = "SHOOT"
                        elif gesture == "palm":
                            command = "MOVE"

                        #print(gesture)
                        if command != prev_commamnd:
                            print(command)
                        prev_commamnd = command

                        cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), (255, 255, 0), 4)
                        cv2.putText(
                            frame,
                            f"ID {ids[i]} : {gesture}",
                            (box[0], box[1] - 10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            1,
                            (0, 0, 255),
                            2,
                        )

                fps = 1.0 / (time.time() - start_time)
                cv2.putText(frame, f"fps {fps:.2f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow("frame", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break


if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run demo")
    parser.add_argument(
        "--detector",
        default='models/hand_detector.onnx',
        type=str,
        help="Path to detector onnx model"
    )

    parser.add_argument(
        "--classifier",
        default='models/crops_classifier.onnx',
        type=str,
        help="Path to classifier onnx model",
    )

    parser.add_argument("--debug", required=False, action="store_true", help="Debug mode")
    args = parser.parse_args()
    run(args)
