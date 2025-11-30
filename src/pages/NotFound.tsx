import NotFoundImg from '../assets/notfound.mp4';
const NotFound = () => {
    return (
        <div className='flex items-center justify-center h-screen bg-white '>
            <div className='p-8 rounded w-full text-center flex flex-col items-center'>
                <video
                    src={NotFoundImg}
                    autoPlay={true}
                    loop
                    preload='auto'
                    muted
                    className='max-w-md'
                />
                <p className='text-xl w-full'>Oops! The page you are looking for does not exist.</p>
            </div>
        </div>
    )
}

export default NotFound
