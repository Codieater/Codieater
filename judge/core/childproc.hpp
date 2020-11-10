#ifndef __CHLIDPROC_H_
#define __CHILDPROC_H_

#include <unistd.h> 
#include <string> 
#include <vector> 
#include <cstring> 
#include <signal.h> 
#include <sys/resource.h>
#include <sys/time.h>
#include "../system/config.hpp"
#include "../system/error.hpp"

using namespace std; 

bool setLimitFd(int maxFd);

bool setLimitProcCount(int maxProc); 

bool setLimitMemory(int maxMemory); 

bool setLimitTime(int maxTime, int targetPid); 

bool removeLimitTime(); 

bool redirectFd(int sourceFd, int destFd, bool closeSrcFd);

int getUsedMemory(struct rusage& resource);

int getUsedCPUTime(struct rusage& resource);
/*  
    startChildProc  : Wrapper class of execv , start child process in specific paht and args

    path : change dir 
    cmd  : command want to be execute 
    args : argument to pass in string array 
    env  : envirnoment varible to set in child process
*/
int startChildProc(string path, string cmd, vector<string> args, vector<string> env); 

#endif
