import { useEffect, useState } from 'react'
import { FullPageChat } from 'flowise-embed-react'
import { useNavigate } from 'react-router-dom'

// Project import
import LoginDialog from '@/ui-component/dialog/LoginDialog'

// API
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'

// MUI
import { Box, Card, Stack, Typography, useTheme } from '@mui/material'
import { IconCircleXFilled } from '@tabler/icons-react'
import { alpha } from '@mui/material/styles'

//Const
import { baseURL } from '@/store/constant'

// ==============================|| Chatbot ||============================== //

const ChatbotFull = () => {
    const URLpath = document.location.pathname.toString().split('/')
    const chatflowId = URLpath[URLpath.length - 1] === 'chatbot' ? '' : URLpath[URLpath.length - 1]
    const navigate = useNavigate()
    const theme = useTheme()

    const [chatflow, setChatflow] = useState(null)
    const [chatbotTheme, setChatbotTheme] = useState({})
    const [loginDialogOpen, setLoginDialogOpen] = useState(false)
    const [loginDialogProps, setLoginDialogProps] = useState({})
    const [isLoading, setLoading] = useState(true)
    const [chatbotOverrideConfig, setChatbotOverrideConfig] = useState({})

    const getSpecificChatflowFromPublicApi = useApi(chatflowsApi.getSpecificChatflowFromPublicEndpoint)
    const getSpecificChatflowApi = useApi(chatflowsApi.getSpecificChatflow)

    const onLoginClick = (username, password) => {
        localStorage.setItem('username', username)
        localStorage.setItem('password', password)
        navigate(0)
    }

    useEffect(() => {
        getSpecificChatflowFromPublicApi.request(chatflowId)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getSpecificChatflowFromPublicApi.error) {
            if (getSpecificChatflowFromPublicApi.error?.response?.status === 401) {
                if (localStorage.getItem('username') && localStorage.getItem('password')) {
                    getSpecificChatflowApi.request(chatflowId)
                } else {
                    setLoginDialogProps({
                        title: 'Login',
                        confirmButtonName: 'Login'
                    })
                    setLoginDialogOpen(true)
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificChatflowFromPublicApi.error])

    useEffect(() => {
        if (getSpecificChatflowApi.error) {
            if (getSpecificChatflowApi.error?.response?.status === 401) {
                setLoginDialogProps({
                    title: 'Login',
                    confirmButtonName: 'Login'
                })
                setLoginDialogOpen(true)
            }
        }
    }, [getSpecificChatflowApi.error])

    useEffect(() => {
        if (getSpecificChatflowFromPublicApi.data || getSpecificChatflowApi.data) {
            const chatflowData = getSpecificChatflowFromPublicApi.data || getSpecificChatflowApi.data
            setChatflow(chatflowData)

            const chatflowType = chatflowData.type
            if (chatflowData.chatbotConfig) {
                let parsedConfig = {}
                if (chatflowType === 'MULTIAGENT' || chatflowType === 'AGENTFLOW') {
                    parsedConfig.showAgentMessages = true
                }

                try {
                    parsedConfig = { ...parsedConfig, ...JSON.parse(chatflowData.chatbotConfig) }
                    setChatbotTheme(parsedConfig)
                    if (parsedConfig.overrideConfig) {
                        setChatbotOverrideConfig(parsedConfig.overrideConfig)
                    }

                    if (parsedConfig.generateNewSession) {
                        localStorage.removeItem(`${chatflowData.id}_EXTERNAL`)
                    }
                } catch (e) {
                    console.error(e)
                    setChatbotTheme(parsedConfig)
                    setChatbotOverrideConfig({})
                }
            } else if (chatflowType === 'MULTIAGENT' || chatflowType === 'AGENTFLOW') {
                setChatbotTheme({ showAgentMessages: true })
            }
        }
    }, [getSpecificChatflowFromPublicApi.data, getSpecificChatflowApi.data])

    useEffect(() => {
        setLoading(getSpecificChatflowFromPublicApi.loading || getSpecificChatflowApi.loading)
    }, [getSpecificChatflowFromPublicApi.loading, getSpecificChatflowApi.loading])

    return (
        <>
            {!isLoading ? (
                <>
                    {!chatflow || chatflow.apikeyid ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                            <Box sx={{ maxWidth: '500px', width: '100%' }}>
                                <Card
                                    variant='outlined'
                                    sx={{
                                        border: `1px solid ${theme.palette.error.main}`,
                                        borderRadius: 2,
                                        padding: '20px',
                                        boxShadow: `0 4px 8px ${alpha(theme.palette.error.main, 0.15)}`
                                    }}
                                >
                                    <Stack spacing={2} alignItems='center'>
                                        <IconCircleXFilled size={50} color={theme.palette.error.main} />
                                        <Typography variant='h3' color='error.main' align='center'>
                                            Invalid Chatbot
                                        </Typography>
                                        <Typography variant='body1' color='text.secondary' align='center'>
                                            {`The chatbot you're looking for doesn't exist or requires API key authentication.`}
                                        </Typography>
                                    </Stack>
                                </Card>
                            </Box>
                        </Box>
                    ) : (
                        <FullPageChat
                            chatflowid={chatflow.id}
                            apiHost={baseURL}
                            chatflowConfig={chatbotOverrideConfig}
                            theme={{ chatWindow: chatbotTheme }}
                        />
                    )}
                    <LoginDialog show={loginDialogOpen} dialogProps={loginDialogProps} onConfirm={onLoginClick} />
                </>
            ) : null}
        </>
    )
}

export default ChatbotFull
