#!/bin/sh

## Author: George Zhao

#Copy the artifacts over and start the process
#Note: When folder is changing, then need to manual change

hosts=("107.182.235.108")


target=/home/deploy
user=gezhao
tarname=cmp-1.1.tar

tar --exclude='./.git/' --exclude='./node_modules' -cvf ../$tarname .

for ix in ${!hosts[*]}
do
	
	echo "scp file to ${hosts[$ix]}"
        scp ../$tarname $user@${hosts[$ix]}:$target


    echo "run command  ${cmds[$ix]} ..."
    ssh $user@${hosts[$ix]} "cd $target; tar -xvf $tarname -C cmp; cd cmp; pwd; sudo sh stopNode.sh; sudo sh startNode.sh"
done

echo "deploy is done!"

