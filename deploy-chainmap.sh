#!/bin/sh

## Author: George Zhao

#Copy the artifacts over and start the process
#Note: When folder is changing, then need to manual change

#hosts=("107.182.235.108")
hosts=("107.181.170.169")

target=/home/chainmap
user=root


for ix in ${!hosts[*]}
do
	
	echo "scp file to ${hosts[$ix]}"
    scp *.* $user@${hosts[$ix]}:$target
    scp ./bin/* $user@${hosts[$ix]}:$target/bin
    scp ./public/image/files/*.* $user@${hosts[$ix]}:$target/public/image/files
    scp ./public/stylesheets/*.* $user@${hosts[$ix]}:$target/public/stylesheets
    scp ./routes/* $user@${hosts[$ix]}:$target/routes
    scp ./views/* $user@${hosts[$ix]}:$target/views
    scp ./views/partials/*.* $user@${hosts[$ix]}:$target/views/partials
    scp ./views/pages/*.* $user@${hosts[$ix]}:$target/views/pages


    echo "run command  ${cmds[$ix]} ..."
    #ssh $user@${hosts[$ix]} "cd $target; pwd; sh startNode.sh"
done

echo "deploy is done!"

