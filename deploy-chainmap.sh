#!/bin/sh

## Author: George Zhao

#Copy the artifacts over and start the process
#Note: When folder is changing, then need to manual change

hosts=("107.182.235.108")

target=/home/chainmap



for ix in ${!hosts[*]}
do
	
	echo "scp file to ${hosts[$ix]}"
    scp *.* gezhao@${hosts[$ix]}:$target
    scp ./bin/* gezhao@${hosts[$ix]}:$target/bin
    scp ./public/image/files/*.* gezhao@${hosts[$ix]}:$target/public/image/files
    scp ./public/stylesheets/*.* gezhao@${hosts[$ix]}:$target/public/stylesheets
    scp ./routes/* gezhao@${hosts[$ix]}:$target/routes
    scp ./views/* gezhao@${hosts[$ix]}:$target/views
    scp ./views/partials/*.* gezhao@${hosts[$ix]}:$target/views/partials
    scp ./views/pages/*.* gezhao@${hosts[$ix]}:$target/views/pages


    echo "run command  ${cmds[$ix]} ..."
    #ssh gezhao@${hosts[$ix]} "cd $target; pwd; sh startNode.sh"
done

echo "deploy is done!"

