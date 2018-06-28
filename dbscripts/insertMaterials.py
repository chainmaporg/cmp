##===========================================================================================================
# 					Rabstar Content Management  
#					Author: George Zhao
#					Created Date: 5/4/2018
#
##===========================================================================================================
import csv
import sys
import json

## Service
## ---------------------------------------------------------------------------------------
class ContentClass:
	type=""
	name=""
	description=""
	link=""
	created=""
	
	


def generateInsStatement(filename):
	list=readFromCsv(filename)
	
	for content in list:
		a="INSERT INTO materials (type, name, description, link, created) "
		b="VALUES("
		c="'"+content.type+"',"+"'"+content.name+"',"+"'"+content.description+"',"+"'"+content.link+"',"+content.created
		d=")"
		print a+b+c+d
	


## Implementation
## ---------------------------------------------------------------------------------------

#Wrapper for a string which maybe do some cleanup
def rr(str):
	return str
	
def readFromCsv(filename):
	with open(filename, mode='r') as csvfile:
		reader = csv.reader(csvfile, quotechar='"', delimiter=',',quoting=csv.QUOTE_ALL, skipinitialspace=True)
		next(reader)
		contentList = []
		for row in reader:
			print "======",row
			if(row[0]):
				content=ContentClass()
				content.type=rr(row[0])
				content.name=rr(row[1])
				content.description=rr(row[2])
				content.link=rr(row[3])
				content.created="NOW()"


				#printRedditgroup(redditgroup)
				contentList.append(content)
		return contentList
		

 
def main():
   generateInsStatement('materials.csv')
 
if __name__ == '__main__':
    main()
    
    