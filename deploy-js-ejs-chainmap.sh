#!/bin/sh

## Author: George Zhao

#Copy the artifacts over and start the process
#Note: When folder is changing, then need to manual change

hosts=("107.182.235.108")

target=/home/chainmap



for ix in ${!hosts[*]}
do
	
	echo "scp file to ${hosts[$ix]}"
    scp ./views/* gezhao@${hosts[$ix]}:$target/views
    scp ./views/partials/*.* gezhao@${hosts[$ix]}:$target/views/partials


    echo "run command  ${cmds[$ix]} ..."
    #ssh gezhao@${hosts[$ix]} "cd $target; pwd; sh startNode.sh"
done

echo "deploy is done!"

