#!/bin/sh

## Author: George Zhao

#Copy the artifacts over and start the process
#Note: When folder is changing, then need to manual change

hosts=("107.181.170.169")

target=/home/deploy
user=root
tarname=cmp-0.2.tar

tar --exclude='./.git/' -cvf ../$tarname .

for ix in ${!hosts[*]}
do
	
	echo "scp file to ${hosts[$ix]}"
        scp ../$tarname $user@${hosts[$ix]}:$target


    echo "run command  ${cmds[$ix]} ..."
    ssh $user@${hosts[$ix]} "cd $target; tar -xvf $tarname -C cmp; cd cmp; pwd; sh stopNode.sh; sh startNode.sh"
done

echo "deploy is done!"

