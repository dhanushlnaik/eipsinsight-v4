import Image from 'next/image'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'

export default function LogoCloud() {
    return (
        <section className="relative overflow-hidden bg-background py-16">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.08),transparent_50%)]" />
            
            <div className="group relative m-auto max-w-7xl px-6">
                <div className="flex flex-col items-center gap-8 md:flex-row">
                    <div className="md:max-w-48 md:border-r md:border-cyan-300/20 md:pr-8">
                        <p className="text-center text-sm font-medium text-slate-300 md:text-end">
                            Supported by organizations across the Ethereum ecosystem
                        </p>
                    </div>
                    <div className="relative w-full py-6 md:w-[calc(100%-12rem)]">
                        <InfiniteSlider
                            speedOnHover={30}
                            speed={50}
                            gap={96}>
                            <div className="flex items-center justify-center px-6">
                                <Image
                                    className="mx-auto h-20 w-auto brightness-110 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:scale-110"
                                    src="/brand/partners/esp.png"
                                    alt="Ethereum Foundation ESP"
                                    height={80}
                                    width={160}
                                />
                            </div>

                            <div className="flex items-center justify-center px-6">
                                <Image
                                    className="mx-auto h-20 w-auto brightness-110 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:scale-110"
                                    src="/brand/partners/ech.png"
                                    alt="Ethereum Cat Herders"
                                    height={80}
                                    width={160}
                                />
                            </div>

                            <div className="flex items-center justify-center px-6">
                                <Image
                                    className="mx-auto h-20 w-auto brightness-110 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:scale-110"
                                    src="/brand/partners/gitcoin.png"
                                    alt="Gitcoin"
                                    height={80}
                                    width={160}
                                />
                            </div>

                            <div className="flex items-center justify-center px-6">
                                <Image
                                    className="mx-auto h-20 w-auto brightness-110 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:scale-110"
                                    src="/brand/partners/ew.png"
                                    alt="EtherWorld"
                                    height={80}
                                    width={160}
                                />
                            </div>
                        </InfiniteSlider>

                        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent"></div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-24"
                            direction="left"
                            blurIntensity={1.5}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-24"
                            direction="right"
                            blurIntensity={1.5}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
