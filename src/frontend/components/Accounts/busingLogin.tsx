/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Button, Flex, FormLabel, Icon, Input, Skeleton, Text } from '@chakra-ui/react'
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/router'
import { handleChange } from '@/utils/form';

import Autocomplete from '@/frontend/components/Forms/Autocomplete';
import { useBusAccount, useBusGroupTree, useBusGroups } from '@/frontend/apis';
import { IBusAccount } from '@/interface/bus';
import { TbBuildingArch, TbLockAccess } from 'react-icons/tb';
import { IAccountUser, getUser, saveBusUser } from '@/utils/auth';
import { type } from 'os';

export type GroupedUnits = Record<string, {name?: string, id?: string}>

export default function BusingLogin() {
    const router = useRouter()
    const [accountType, setAccountType] = useState('')
    const [userAccount, setUserAccount] = useState<IBusAccount>()
    const [loading, setLoading] = useState(false)
    const [fields, setFIelds] = useState< Record<string, string | null | Record<string, string>>>({
      id: '',
      group:  null
    })

    const accountTypes = {
        "Bus Rep": "ZONE",
        "Branch Head": "BRANCH",
        "Sector Head": "SECTOR"
    }

    const { data: groups, isLoading } = useBusGroups(accountType, !!accountType);
    const groupData = groups?.data?.map(item => ({label: item.name, value: item._id as string}))

    const {data: account, isLoading: accountIsLoading} = useBusAccount(
        {name: (fields.id as string)?.toLowerCase() as string, group: (fields?.group as {value: string})?.value},
        Boolean(fields.id && (fields?.group as {value: string})?.value)
    )

    const userAccountData = account?.data as IBusAccount[]

     const { data: tree, isLoading: treeLoading } = useBusGroupTree(userAccount?.group as string, !!userAccount?.group);

    const treeData = tree?.data || []

    useEffect(() => {
        setFIelds(prev => ({...prev, group: null}))
    }, [groups])

    useEffect(() => {
        if(userAccountData?.length){
            setUserAccount(userAccountData[0])
        }
    },[userAccountData])

      const gotoBusPage = (roles: ("BUS_REP" | "BRANCH_HEAD" | "SECTOR_HEAD" | "OVERALL_HEAD")[]) => {
         if(roles?.includes('BUS_REP')){
            router.push('/bus/bus-rep/logs')
        } else if(roles?.includes('BRANCH_HEAD')){
            router.push('/bus/branch-head')
        } else if(roles?.includes('SECTOR_HEAD')){
            router.push('/bus/sector-head')
        }
    }

    useEffect(() => {
        const user = getUser()
        if(user?.currentApp === 'BUSING'){
            gotoBusPage(user?.roles || [])
        }
    }, [])
    const createUnitObj = () => {
        return treeData.reduce((acc: GroupedUnits, cValue) => {
            acc[cValue.type] = {
                name: cValue.name,
                id: cValue._id
            }
            return acc
        }, {})
    }

    const handleContinue = () => {
        try {
            setLoading(true)
                const user: IAccountUser = {
                name: userAccount?.name as string, 
                accountId: userAccount?._id as string,
                bus: createUnitObj(),
                roles: userAccount?.accountType as any,
                currentApp: "BUSING"
            }
            saveBusUser(user)
            gotoBusPage(user?.roles || [])
        } catch (error) {
            
        } finally {
            setLoading(false)
        }
       
    }

    return (
    <>
        { (!fields['id']?.length || !fields['group']) &&  !(!fields['id']?.length && !fields['group']) ? 
            <Box 
                mb={4} 
                bg="red.400" 
                rounded={"sm"} 
                color="white" 
                px={4} py={3} 
                w="100%"
            >
                You&lsquo;ve either not selected an ID or a Bus Unit</Box>
                : null
        }
        <Box mb={6} fontSize={14}>
            <FormLabel color="gray.700">Enter Account ID</FormLabel>
            <Input fontSize={14} placeholder='Enter ID Here ' value={fields.id as string } 
            onChange={v =>   handleChange(v.currentTarget?.value, 'id', fields, setFIelds)}
            />
        </Box>
        {!accountType.length ? 
            <Box 
                mb={4} 
                bg="blue.400" 
                rounded={"sm"} 
                color="white" 
                px={4} py={3} 
                w="100%"
            >
                Select an account type to continue</Box>
            : null
        }
        <Box mb={6} fontSize={14}>
            <FormLabel color="gray.700" fontSize={17}>Select account type</FormLabel>
            <Flex justifyContent={"space-between"}>
                {Object.keys(accountTypes)?.map(item => (
                    <Flex align={"center"} gap={2} key={item}>
                        <Flex 
                            p={1} 
                            rounded={"sm"} 
                            borderWidth={1} 
                            borderColor={accountType === accountTypes[item as "Bus Rep" | "Branch Head" | "Sector Head"] ? "blue.400" :"gray.200"} 
                            w={7} h={7}
                            cursor={"pointer"}
                            onClick={() => 
                                setAccountType(accountTypes[item as "Bus Rep" | "Branch Head" | "Sector Head"])
                            }
                        >
                            <Box w={"100%"} h="100%" bg={accountType === accountTypes[item as "Bus Rep" | "Branch Head" | "Sector Head"] ? "blue.400" :"gray.300"} ></Box>
                        </Flex>
                        <Text>{item}</Text>
                    </Flex>
                ))}
            </Flex>
        </Box>
        {accountType && <Box>
            { !isLoading ?
        (
            <Box fontSize={14}>
                <FormLabel color="gray.700">Select {accountType.toLowerCase()}</FormLabel>
                <Autocomplete 
                    value={fields['group'] as string}
                    name='group'
                    options={groupData || []}
                    fields={fields as Record<string, string>}
                    setFields={setFIelds as unknown as Dispatch<SetStateAction<Record<string, string | boolean | undefined>>>}
                    placeholder='Enter zone name here ...'
                />
            </Box>
        ) : <Skeleton w="100%" h={48} rounded={'md'}/>}
        </Box>}

        {
        (fields['id']?.length && fields['group']) ? 
            <>
                {!userAccountData?.length && !accountIsLoading ? 
                    <Box 
                        mb={4} 
                        bg="orange.400" 
                        rounded={"sm"} 
                        color="white" 
                        px={4} py={3} 
                        w="100%"
                        mt={4}
                    >
                        It appears the selected account does not have access to the busing system kindly reach out to your branch head
                    </Box> : (userAccountData?.length && !accountIsLoading) ?
                     (
                        <>
                            <Box mt={4} p={4} bg={'blue.100'} rounded="md" fontSize={15}>
                                <Flex justify={"space-between"} pb={2}>
                                    <Flex gap={1} align={"center"}>
                                        <Icon as={TbLockAccess} fontSize={24}/>
                                        <Text>role(s)</Text>
                                    </Flex>
                                    <Flex>
                                            {userAccount?.accountType?.map(item => (
                                                <Box key={item} 
                                                    py={1}
                                                    px={4}
                                                    color={"white"}
                                                    rounded={"full"} 
                                                    bg="blue.400" 
                                                    fontSize={14}
                                                    textTransform={"capitalize"}>{item.replace("_", " ").toLowerCase()}</Box>
                                            ))}
                                    </Flex>
                                </Flex>
                                <hr style={{borderColor: "#57b2e6"}} />
                                {treeLoading ? <Skeleton w="100%" h={24} color='blue.400' mt={4} /> : <Box>
                                    {treeData.map(item => (
                                        <Flex key={item._id} justify={"space-between"} pb={2} mt={2}>
                                            <Flex gap={1} align={"center"}>
                                                <Icon as={TbBuildingArch} fontSize={20}/>
                                                <Text fontWeight={500}>{item?.type?.toLowerCase()}</Text>
                                            </Flex>
                                            <Flex>
                                                {item.name}
                                            </Flex>
                                        </Flex>)
                                        )
                                    }
                                </Box>}
                            </Box>
                            
                            <Box as={Button} 
                                colorScheme="black"
                                px={5}
                                py={2}
                                mt={8}
                                w={"100%"}
                                color="white" 
                                onClick={() => handleContinue()}
                                bg={ "base.blue" }
                                _hover={{bg:  "base.blue" }}
                                isLoading={loading}
                                isDisabled={loading || treeLoading}
                            >Continue</Box>
                        </>
                    )  :
                    <Skeleton w="100%" h={24} mt={4} /> 
                }
            </> 
            : 
            null
        }
    </>
  )
}