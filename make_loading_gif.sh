#!/bin/sh

fg=${1:-'#acffac'}
bg=${2:-'transparent'}
dstfile=${3:-'loading.gif'}
size=64x64
framenum=20
delay=5
blur=50
swirl=150

echo "Creating $dstfile with:"
echo "    Foreground color: $fg"
echo "    Background color: $bg"
echo "                Size: $size"
echo "    Number of frames: $framenum"
echo "Delay between frames: $delay"
echo

set -e

convert -size 500x500 xc:"$bg" -draw \
    "fill none
     stroke-width 80
     stroke $fg
     ellipse 250,250 200,200 0,80" \
    loading_base.png

stepsize=$((360/$framenum))
for i in $(seq $framenum); do
    rotation=$(($i*$stepsize))
    framename="frame_$(printf %03d $i)of${framenum}_${size}_r${rotation}"
    echo "Creating frame $framename ..."

    # rotate
    filename=
    if [ ! -e "$framename.png" ]; then
	convert loading_base.png \
                -matte \( +clone -background "$bg" -rotate $rotation \) \
                -gravity center -compose Src -composite "$framename.png"
    fi

    if [ ! -e "$framename.gif" ]; then
    convert "$framename.png" -filter triangle -resize $size \
	-radial-blur $blur -swirl $swirl "$framename.gif"
    fi
done

gifsicle --disposal bg --delay=$delay --loop frame_*of${framenum}_${size}_*.gif > "$dstfile"

rm frame_* loading_base.png
